# GenLayer Portal Submission

## Contribution

**Type:** Builder -> Projects

**Title:** MergeProof - Validator-Verifiable GitHub Bounty Escrow on GenLayer

## Description

MergeProof is a GitHub bounty escrow for work that cannot be verified by a simple on-chain condition. A sponsor links a public GitHub issue, writes acceptance criteria, and funds the bounty with GEN. A developer submits a pull request from the same repository. The Intelligent Contract fetches the live issue and PR, then GenLayer validators judge whether the PR is merged and every pre-agreed criterion is supported by visible evidence. Agreement releases escrow directly to the developer; missing or weak evidence requests revision. GenLayer is central because the payment depends on validator consensus over a qualitative real-world delivery, not a centralized reviewer or format-only JSON check. The frontend handles funding, submission, withdrawal recovery, judgment, revision, refund, and transaction status.

## Evidence

- GitHub repository: https://github.com/jasonmirza1/genlayer-mergeproof
- Intelligent Contract source: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/contracts/mergeproof.py
- Direct contract tests: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/tests/direct/test_mergeproof.py
- Live app: https://genlayer-mergeproof.vercel.app
- Demo video: https://youtu.be/m0RhEOSz7jc
- Bradbury contract: https://explorer-bradbury.genlayer.com/address/0x5610791050A2D7255F1CBD0802fBd9e41A5F205c
- Bradbury deployment transaction: https://explorer-bradbury.genlayer.com/tx/0x199ef39cd9e4160172070b6558e865d0263f53b06e80945e824c6982214ad096
- Successful paid settlement: https://explorer-bradbury.genlayer.com/tx/0xa3dbb04e7d4a169c72f9df7e0ec2827810987ad9749dc14fe33ba02c3c9fa389
- Merged evidence pull request: https://github.com/jasonmirza1/genlayer-mergeproof/pull/2
- Paid workflow screenshot: https://github.com/jasonmirza1/genlayer-mergeproof/blob/main/docs/mergeproof-paid.png

## Reviewer Path

1. Open the contract source and inspect `_judge_submission`, `create_bounty`, and `evaluate_submission`.
2. Confirm live evidence is fetched with `gl.nondet.web.render`.
3. Confirm equivalence compares the actual approve/revision outcome and criterion coverage.
4. Confirm escrow is supplied through a payable call and released only after an approved judgment.
5. Run the direct tests and frontend production build using the README commands.

## Demo Checklist

- Wallet connected to GenLayer Bradbury
- Sponsor creates and funds a bounty from a public GitHub issue
- A different wallet submits a merged pull request from the same repository
- Validator judgment displays its evidence summary
- Approved bounty changes to Paid and shows the transaction in Bradbury Explorer
- A deliberately incomplete submission demonstrates Revision requested
