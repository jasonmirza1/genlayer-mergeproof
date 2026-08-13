# GenLayer Portal Submission

## Contribution

**Type:** Builder -> Projects

**Title:** MergeProof - Validator-Verifiable GitHub Bounty Escrow on GenLayer

## Description

MergeProof is a GitHub bounty escrow for work that cannot be verified by a simple on-chain condition. A sponsor links a public GitHub issue, writes acceptance criteria, and funds the bounty with GEN. A developer submits a pull request plus a public ownership-proof Gist from the PR author's GitHub account. The Gist binds the bounty ID and canonical PR URL to the claimant wallet. GenLayer validators fetch all three live evidence pages and release escrow only when the work qualifies, the Gist owner is the PR author, and the wallet challenge matches. Missing work or failed ownership requests revision. GenLayer is central because payment depends on validator consensus over qualitative delivery and cross-site identity evidence, not a centralized reviewer.

## Evidence

- GitHub repository: https://github.com/jasonmirza1/genlayer-mergeproof
- Intelligent Contract source: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/contracts/mergeproof.py
- Direct contract tests: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/tests/direct/test_mergeproof.py
- Live app: https://genlayer-mergeproof.vercel.app
- Demo video: https://youtu.be/m0RhEOSz7jc
- Bradbury contract: https://explorer-bradbury.genlayer.com/address/0x746C51C257dF5e4b34466BAE1ce692e3fe87f8d0
- Bradbury deployment transaction: https://explorer-bradbury.genlayer.com/tx/0xd9196a30941f662bd4bcceea9a6d0d6990ae94abb1c6a11dcf64a20ec996f03f
- Corrected ownership settlement: https://explorer-bradbury.genlayer.com/tx/0x2a67669764456a7cff9fcb7279fb3ef7933e585202b5dcfa1da8e2b3ce5cb2f5
- Ownership-proof Gist: https://gist.github.com/jasonmirza1/a1bd857282950b18b8162f87e64c0a9c
- Merged evidence pull request: https://github.com/jasonmirza1/genlayer-mergeproof/pull/2
- Corrected paid-state screenshot: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/docs/mergeproof-paid.png

## Reviewer Path

1. Open the contract source and inspect `_judge_submission`, `submit_work`, and `evaluate_submission`.
2. Confirm live issue, PR, and ownership-Gist evidence is fetched with `gl.nondet.web.render`.
3. Confirm equivalence compares the outcome, criterion coverage, Gist owner/PR author match, and exact wallet challenge.
4. Inspect `test_stolen_pull_request_cannot_be_claimed_by_unrelated_wallet` and confirm failed ownership transfers no funds.
5. Confirm escrow is supplied through a payable call and released only after an approved judgment with verified ownership.
6. Run the direct tests and frontend production build using the README commands.

## Demo Checklist

- Wallet connected to GenLayer Bradbury
- Sponsor creates and funds a bounty from a public GitHub issue
- A different wallet submits a merged pull request from the same repository
- Validator judgment displays its evidence summary
- Approved bounty changes to Paid and shows the transaction in Bradbury Explorer
- A deliberately incomplete submission demonstrates Revision requested
