import json
import os
from pathlib import Path

import pytest


pytestmark = pytest.mark.integration


def test_mismatched_ownership_gist_cannot_release_funds(default_account, accounts):
    """Run against Studio/localnet with mocked validators when explicitly enabled."""
    if os.getenv("MERGEPROOF_RUN_INTEGRATION") != "1":
        pytest.skip("Set MERGEPROOF_RUN_INTEGRATION=1 to run the network integration test")
    if len(accounts) < 2:
        pytest.skip("The integration test needs a separate worker account")

    from gltest import get_contract_factory, get_validator_factory
    from gltest.assertions import tx_execution_succeeded
    from gltest.types import TransactionHashVariant, TransactionStatus

    issue_url = "https://github.com/example/mergeproof-fixture/issues/1"
    pull_request_url = "https://github.com/example/mergeproof-fixture/pull/2"
    ownership_proof_url = "https://gist.github.com/thief/abcdef123"
    contract_path = Path(__file__).parents[2] / "contracts" / "mergeproof.py"

    factory = get_contract_factory(contract_file_path=contract_path)
    contract = factory.deploy(account=default_account)

    created = contract.create_bounty(
        args=[
            "Ownership-protected fixture",
            issue_url,
            "Implement the issue requirements and include passing direct tests.",
        ]
    ).transact(value=10**15)
    assert tx_execution_succeeded(created)

    worker_contract = contract.connect(accounts[1])
    submitted = worker_contract.submit_work(
        args=["1", pull_request_url, ownership_proof_url]
    ).transact()
    assert tx_execution_succeeded(submitted)

    validator = get_validator_factory().create_mock_validator(
        mock_llm_response={
            "nondet_exec_prompt": {
                ".*": json.dumps(
                    {
                        "outcome": "APPROVE",
                        "evidence_quality": "ENOUGH",
                        "ownership_verified": False,
                        "github_author": "real-author",
                        "summary": "The PR qualifies, but the claimant does not control the author account.",
                        "unmet_criteria": ["Ownership Gist belongs to a different GitHub account"],
                    }
                )
            },
            "eq_principle_prompt_comparative": {".*": True},
            "eq_principle_prompt_non_comparative": {".*": True},
        },
        mock_web_response={
            "nondet_web_request": {
                issue_url: {"method": "GET", "status": 200, "body": "Issue evidence"},
                pull_request_url: {"method": "GET", "status": 200, "body": "Merged pull request evidence"},
                ownership_proof_url: {"method": "GET", "status": 200, "body": "Gist owned by thief"},
            }
        },
    )

    judged = worker_contract.evaluate_submission(args=["1"]).transact(
        wait_transaction_status=TransactionStatus.ACCEPTED,
        transaction_context={"validators": [validator.to_dict()]},
    )
    assert tx_execution_succeeded(judged)

    state = contract.get_bounty(args=["1"]).call(
        transaction_hash_variant=TransactionHashVariant.LATEST_NONFINAL
    )
    assert state["status"] == "REVISION_REQUESTED"
    assert state["worker"] == accounts[1].address
