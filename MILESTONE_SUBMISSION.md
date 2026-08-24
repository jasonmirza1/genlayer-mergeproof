# MergeProof Evidence Lock Milestone

## Contribution

**Type:** Builder -> Milestones

**Title:** MergeProof Evidence Lock - Immutable PR and Ownership Proof Review

## Description

MergeProof now locks the exact GitHub evidence that validators must review. After merge, the frontend resolves GitHub's full final merge commit, embeds it in the claimant's wallet-ownership challenge, and then resolves the ownership Gist's exact revision. Both immutable identifiers are stored by the Intelligent Contract. Validators inspect the immutable merge-commit page and revision-specific Gist. The contract also deterministically rejects a Gist URL owner that differs from the validator-reported pull-request author, even if a validator response otherwise says APPROVE. Changed evidence, missing locks, or mismatched ownership forces revision and cannot release escrow.

## Meaningful Change

- Binds every submission to a full 40-character final merge commit and Gist revision.
- Reviews the immutable revision-specific Gist instead of mutable latest content.
- Requires validator agreement that both evidence locks match the reviewed outcome.
- Adds a two-step frontend flow to prepare the ownership challenge and lock evidence before signing.
- Displays stored lock identifiers for users and reviewers.
- Adds negative regression coverage proving changed evidence cannot release escrow.
- Preserves claimant ownership verification, bounded recovery, and finalized-only paid status.

## Evidence

- Repository: https://github.com/jasonmirza1/genlayer-mergeproof
- Intelligent Contract: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/contracts/mergeproof.py
- Direct tests: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/tests/direct/test_mergeproof.py
- Frontend evidence resolver: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/frontend/lib/github/evidence.ts
- Live app: https://genlayer-mergeproof.vercel.app
- Bradbury contract: https://explorer-bradbury.genlayer.com/address/0x47d9e69867E0bDD3a6343261c18db12B275899bf
- Deployment transaction: https://explorer-bradbury.genlayer.com/tx/0x0d028383b2faadadbd230c4cac15f9e1a19f762a502544aab684119742e6f151
- Locked-evidence settlement transaction: add after the corrected deployment is exercised end to end.
- Updated demo video: record after the corrected settlement reaches finality.

## Reviewer Path

1. Inspect `submit_work` and confirm it validates and stores both full Git SHAs.
2. Inspect `_judge_submission` and confirm it fetches the revision-specific Gist and requires the locked PR commit to be the merged commit.
3. Inspect the comparative principle and confirm validators must agree that both stored evidence locks match.
4. Run `python -m pytest tests\direct\test_mergeproof.py -v` and inspect `test_changed_locked_evidence_cannot_release_escrow`.
5. Run `genvm-lint check contracts\mergeproof.py`, `npm run lint`, and `npm run build`.
6. In the live app, prepare a PR commit, copy the generated challenge to a public Gist, lock the Gist revision, and confirm both immutable values appear before signing and in the submitted bounty.

## Deployment Status

The implementation and local verification are complete. The corrected Evidence Lock contract is deployed and verified on Bradbury. An end-to-end locked-evidence settlement and updated demo recording remain to be added as evidence.
