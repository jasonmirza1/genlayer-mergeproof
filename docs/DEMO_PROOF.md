# MergeProof Demo Evidence

- **Sponsor escrow:** A sponsor funds a bounty with GEN before work begins, and the Intelligent Contract records the amount, issue URL, and acceptance criteria together.
- **GitHub evidence:** The developer submits a public pull request from the same repository. The contract fetches the live issue and pull-request pages instead of trusting a user-provided summary.
- **GenLayer validator judgment:** Validators compare the merged pull request with the pre-agreed criteria. Equivalent approval releases escrow to the developer; missing or weak evidence requests revision.

See the [project README](../README.md) for the complete workflow, contract architecture, Bradbury deployment, and verification commands.
