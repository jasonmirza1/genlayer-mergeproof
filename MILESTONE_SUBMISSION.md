# MergeProof Evidence Lock Milestone

## Contribution

**Type:** Builder -> Milestones

**Title:** MergeProof Evidence Lock - Immutable PR and Ownership Proof Review

## Description

MergeProof now locks the exact GitHub evidence that validators must review. Before submission, the frontend resolves the pull request's full head commit, embeds it in the claimant's wallet-ownership challenge, and then resolves the ownership Gist's exact revision. Both immutable identifiers are stored by the Intelligent Contract. Validators must confirm that the locked PR commit is the commit visibly merged and must inspect the revision-specific Gist URL. A force-push, changed merged commit, edited Gist, missing lock, or mismatched ownership proof forces revision and cannot release escrow. The frontend exposes both locks before signing and in the live ledger. New direct tests prove malformed locks are rejected and changed locked evidence transfers no funds.

## Meaningful Change

- Binds every submission to a full 40-character PR head commit and Gist revision.
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
- Bradbury contract: https://explorer-bradbury.genlayer.com/address/0xC690d00c00Be2087d47188D9eEE50A64C0b62E4f
- Deployment transaction: https://explorer-bradbury.genlayer.com/tx/0xe5e8e0f410dfbe4512321abd65972a675dd440345fe51e7bb7e325664628060f
- Locked-evidence settlement transaction: `PENDING_END_TO_END_TEST`
- Updated demo video: `PENDING_UPDATED_VIDEO`

## Reviewer Path

1. Inspect `submit_work` and confirm it validates and stores both full Git SHAs.
2. Inspect `_judge_submission` and confirm it fetches the revision-specific Gist and requires the locked PR commit to be the merged commit.
3. Inspect the comparative principle and confirm validators must agree that both stored evidence locks match.
4. Run `python -m pytest tests\direct\test_mergeproof.py -v` and inspect `test_changed_locked_evidence_cannot_release_escrow`.
5. Run `genvm-lint check contracts\mergeproof.py`, `npm run lint`, and `npm run build`.
6. In the live app, prepare a PR commit, copy the generated challenge to a public Gist, lock the Gist revision, and confirm both immutable values appear before signing and in the submitted bounty.

## Deployment Status

The implementation and local verification are complete. The Evidence Lock contract is deployed and verified on Bradbury. An end-to-end locked-evidence settlement and updated demo recording remain pending.
