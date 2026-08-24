# MergeProof Evidence Lock Proof

This document maps the Evidence Lock milestone to observable implementation and test evidence. The milestone prevents a claimant from changing the reviewed GitHub evidence, claiming another author's work, or presenting an accepted transaction as paid before finalization.

## Immutable merge-commit evidence

- The frontend resolves GitHub's final `merge_commit_sha` only after confirming that the pull request is merged.
- `submit_work` stores the full 40-character merge commit with the bounty submission.
- Validators fetch the immutable GitHub commit URL and require the stored value to match the commit visibly merged by the pull request.
- A missing, changed, or unverifiable commit lock forces revision and cannot release escrow.

Implementation: `frontend/lib/github/evidence.ts`, `frontend/components/MergeProofApp.tsx`, and `contracts/mergeproof.py`.

## Revision-locked ownership proof

- The claimant publishes the generated challenge as a public Gist from the pull-request author's GitHub account.
- The frontend resolves the Gist's full revision identifier and submits the revision-specific URL.
- Validators review that immutable revision instead of the editable latest-Gist URL.
- The challenge binds the bounty ID, canonical pull-request URL, final merge commit, and claimant wallet.

## Deterministic ownership rejection

- The contract compares the Gist URL owner with the validator-reported pull-request author after the comparative judgment.
- An owner mismatch deterministically changes the result to `REVISION`, marks ownership unverified, and prevents payment.
- This enforcement remains effective even when a malicious or mistaken model response says `APPROVE`.

Regression coverage: `test_stolen_pull_request_cannot_be_claimed_by_unrelated_wallet` in `tests/direct/test_mergeproof.py` and the integration scenario in `tests/integration/test_mergeproof_ownership.py`.

## Bounded recovery

- A claimant can withdraw a submitted work claim without receiving escrow.
- If evaluation cannot complete and the claimant does not withdraw, the sponsor can reopen a `SUBMITTED` bounty after the fixed two-hour recovery window.
- Reopening clears the stale submission while preserving the sponsor-controlled escrow for a new attempt.
- Open and revision-requested bounties remain refundable by the sponsor; released funds cannot be reclaimed.

## Finality-aware settlement

- The frontend distinguishes accepted consensus from finalized settlement.
- After `ACCEPTED`, the interface reports that the transaction is awaiting finality and does not label the bounty paid.
- The finalized ledger is refreshed only after `FINALIZED`; `Paid` reflects the contract's finalized `RELEASED` state.
- This prevents a provisional consensus result from being shown as a completed GEN payout.

## Verification

Run the focused checks from the repository root:

```powershell
python -m pytest tests/direct/test_mergeproof.py -v
python -m pytest tests/integration/test_mergeproof_ownership.py -v
genvm-lint check contracts/mergeproof.py
npm run build
```

The integration test requires a running local GenLayer RPC. Direct tests exercise the deterministic ownership mismatch and changed-lock failure paths without external services.

Return to the [MergeProof README](../README.md).
