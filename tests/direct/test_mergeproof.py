import importlib.util
import json
import sys
import types
from pathlib import Path

import pytest


class _TreeMap(dict):
    def __class_getitem__(cls, _item):
        return cls


class _Address(str):
    @property
    def as_hex(self):
        return str(self)


class _U256(int):
    pass


class _WriteDecorator:
    def __call__(self, fn):
        return fn

    def payable(self, fn):
        return fn


class _Public:
    write = _WriteDecorator()

    @staticmethod
    def view(fn):
        return fn


class _Vm:
    class UserError(Exception):
        pass


class _Message:
    sender_address = _Address("0xSponsor")
    value = _U256(0)


class _Web:
    @staticmethod
    def render(url, mode="text"):
        assert mode == "text"
        if "/issues/" in url:
            return "Issue: add input validation and tests. Acceptance checklist is visible."
        return "Pull request changes validation code and adds passing tests."


class _Nondet:
    web = _Web()
    judgment = {
        "outcome": "APPROVE",
        "evidence_quality": "ENOUGH",
        "summary": "The pull request demonstrates every agreed requirement.",
        "unmet_criteria": [],
    }

    @classmethod
    def exec_prompt(cls, task, response_format=None):
        assert response_format == "json"
        assert "untrusted evidence" in task
        assert "Do not require criteria" in task
        return cls.judgment


class _EqPrinciple:
    @staticmethod
    def prompt_comparative(leader_fn, principle):
        assert "same APPROVE or REVISION outcome" in principle
        assert "merely because" in principle
        captured = [cell.cell_contents for cell in (leader_fn.__closure__ or [])]
        assert not any(hasattr(value, "__dataclass_fields__") for value in captured)
        return leader_fn()


class _Evm:
    @staticmethod
    def contract_interface(cls):
        return cls


class _Gl:
    Contract = object
    public = _Public()
    vm = _Vm
    message = _Message()
    nondet = _Nondet()
    eq_principle = _EqPrinciple()
    evm = _Evm()


def _allow_storage(cls):
    return cls


def _load_module():
    stub = types.ModuleType("genlayer")
    stub.TreeMap = _TreeMap
    stub.Address = _Address
    stub.u256 = _U256
    stub.gl = _Gl
    stub.allow_storage = _allow_storage
    sys.modules["genlayer"] = stub

    path = Path(__file__).parents[2] / "contracts" / "mergeproof.py"
    spec = importlib.util.spec_from_file_location("mergeproof_test", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def _contract(module):
    contract = object.__new__(module.MergeProof)
    contract.bounties = _TreeMap()
    contract.bounty_count = _U256(0)
    return contract


def _set_sender(address, value=0):
    _Gl.message.sender_address = _Address(address)
    _Gl.message.value = _U256(value)


def test_normalizes_github_issue_and_pull_request_urls():
    module = _load_module()
    contract = _contract(module)

    issue, issue_repo = contract._parse_github_url(
        "https://www.github.com/Example/Repo/issues/12?tab=activity", "issue"
    )
    pull, pull_repo = contract._parse_github_url(
        "https://github.com/example/repo/pull/44#discussion", "pull"
    )

    assert issue == "https://github.com/Example/Repo/issues/12"
    assert pull == "https://github.com/example/repo/pull/44"
    assert issue_repo == pull_repo == "example/repo"


@pytest.mark.parametrize(
    "url,resource",
    [
        ("http://github.com/a/b/issues/1", "issue"),
        ("https://github.com/a/b", "issue"),
        ("https://github.com/a/b/issues/not-a-number", "issue"),
        ("https://gitlab.com/a/b/pull/1", "pull"),
    ],
)
def test_rejects_invalid_evidence_urls(url, resource):
    module = _load_module()
    contract = _contract(module)

    with pytest.raises(Exception):
        contract._parse_github_url(url, resource)


def test_create_bounty_requires_specific_criteria_and_escrow():
    module = _load_module()
    contract = _contract(module)

    _set_sender("0xSponsor", 0)
    with pytest.raises(Exception, match="escrow"):
        contract.create_bounty(
            "Validation bounty",
            "https://github.com/example/repo/issues/1",
            "Add validation and direct tests for malformed inputs.",
        )

    _set_sender("0xSponsor", 10**18)
    created = contract.create_bounty(
        "Validation bounty",
        "https://github.com/example/repo/issues/1",
        "Add validation and direct tests for malformed inputs.",
    )

    assert created["id"] == "1"
    assert created["status"] == "OPEN"
    assert created["amount"] == 10**18
    assert created["sponsor"] == "0xSponsor"


def test_submission_must_match_issue_repository():
    module = _load_module()
    contract = _contract(module)
    _set_sender("0xSponsor", 10**18)
    contract.create_bounty(
        "Validation bounty",
        "https://github.com/example/repo/issues/1",
        "Add validation and direct tests for malformed inputs.",
    )

    _set_sender("0xWorker")
    with pytest.raises(Exception, match="issue repository"):
        contract.submit_work("1", "https://github.com/other/repo/pull/2")

    submitted = contract.submit_work(
        "1", "https://github.com/example/repo/pull/2"
    )
    assert submitted["status"] == "SUBMITTED"
    assert submitted["worker"] == "0xWorker"


def test_approved_submission_releases_escrow():
    module = _load_module()
    contract = _contract(module)
    transfers = []

    class Recipient:
        def __init__(self, address):
            self.address = address

        def emit_transfer(self, value):
            transfers.append((str(self.address), int(value)))

    module._Recipient = Recipient
    _Nondet.judgment = {
        "outcome": "APPROVE",
        "evidence_quality": "ENOUGH",
        "summary": "All acceptance criteria are supported by the pull request.",
        "unmet_criteria": [],
    }

    _set_sender("0xSponsor", 2 * 10**18)
    contract.create_bounty(
        "Validation bounty",
        "https://github.com/example/repo/issues/1",
        "Add validation and direct tests for malformed inputs.",
    )
    _set_sender("0xWorker")
    contract.submit_work("1", "https://github.com/example/repo/pull/2")

    result = contract.evaluate_submission("1")

    assert result["status"] == "RELEASED"
    assert transfers == [("0xWorker", 2 * 10**18)]


def test_weak_evidence_requests_revision_then_sponsor_can_refund():
    module = _load_module()
    contract = _contract(module)
    transfers = []

    class Recipient:
        def __init__(self, address):
            self.address = address

        def emit_transfer(self, value):
            transfers.append((str(self.address), int(value)))

    module._Recipient = Recipient
    _Nondet.judgment = {
        "outcome": "APPROVE",
        "evidence_quality": "WEAK",
        "summary": "The pull request page does not expose enough evidence.",
        "unmet_criteria": ["Passing tests are not visible"],
    }

    _set_sender("0xSponsor", 10**18)
    contract.create_bounty(
        "Validation bounty",
        "https://github.com/example/repo/issues/1",
        "Add validation and direct tests for malformed inputs.",
    )
    _set_sender("0xWorker")
    contract.submit_work("1", "https://github.com/example/repo/pull/2")

    judged = contract.evaluate_submission("1")
    assert judged["status"] == "REVISION_REQUESTED"
    assert judged["unmet_criteria"] == ["Passing tests are not visible"]
    assert transfers == []

    _set_sender("0xSponsor")
    refunded = contract.cancel_bounty("1")
    assert refunded["status"] == "REFUNDED"
    assert transfers == [("0xSponsor", 10**18)]


def test_bounty_views_serialize_records():
    module = _load_module()
    contract = _contract(module)
    _set_sender("0xSponsor", 10**18)
    contract.create_bounty(
        "First bounty",
        "https://github.com/example/repo/issues/1",
        "Implement the issue requirements and include passing direct tests.",
    )
    contract.create_bounty(
        "Second bounty",
        "https://github.com/example/repo/issues/2",
        "Implement the issue requirements and include passing direct tests.",
    )

    assert contract.get_bounty_count() == 2
    assert contract.get_bounty("1")["title"] == "First bounty"
    assert [item["id"] for item in contract.get_bounties(0, 10)] == ["1", "2"]
    assert contract.get_bounty("99") == {}
