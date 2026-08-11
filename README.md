# MergeProof

MergeProof is GitHub bounty escrow that releases payment only after GenLayer validators inspect live issue and pull-request evidence. A sponsor writes the acceptance criteria before funding the bounty. A developer submits a pull request from the same repository. The Intelligent Contract fetches both pages and judges whether the pull request is merged and the written criteria are supported by visible evidence.

This is a trust problem rather than a request for a better AI answer: an irreversible GEN transfer depends on a qualitative commercial outcome. The judgment and payout happen in one Intelligent Contract transaction, so neither party controls the evaluator or a private backend.

## Workflow

1. A sponsor creates a bounty from a public GitHub issue, writes specific acceptance criteria, and escrows GEN.
2. A developer submits a public pull request from the same repository.
3. Any user can trigger evaluation. Validators independently fetch the issue and pull request.
4. Equivalent validator judgments release escrow to the developer. Missing, weak, unmerged, or contradictory evidence requests revision.
5. The sponsor may refund an open bounty or a bounty awaiting revision. Released funds cannot be reclaimed.

## Why GenLayer

Normal contracts cannot decide whether a pull request actually satisfies prose acceptance criteria. MergeProof uses `gl.nondet.web.render` to collect live GitHub evidence and `gl.eq_principle.prompt_comparative` to require validators to agree on the substantive outcome and criterion coverage. Valid JSON alone is explicitly insufficient. The contract also treats repository text as untrusted evidence and instructs validators to ignore embedded prompt injection.

## Contract

- Source: [`contracts/mergeproof.py`](contracts/mergeproof.py)
- Direct tests: [`tests/direct/test_mergeproof.py`](tests/direct/test_mergeproof.py)
- Bradbury network: chain ID `4221`
- Bradbury contract: `DEPLOYMENT_PENDING`
- Deployment transaction: `DEPLOYMENT_PENDING`
- Explorer: <https://explorer-bradbury.genlayer.com>

### State lifecycle

```text
OPEN -> SUBMITTED -> RELEASED
  |         |
  |         +-> REVISION_REQUESTED -> SUBMITTED
  |                    |
  +--------------------+-> REFUNDED
```

## Run locally

Requirements: Node.js, Python, the GenLayer CLI, and `genvm-lint`.

```powershell
npm install
Copy-Item frontend\.env.example frontend\.env
npm run dev
```

Open <http://127.0.0.1:3000>. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in the uncommitted `frontend/.env` after deployment. Connect an EVM wallet on GenLayer Bradbury.

## Verify

```powershell
npm run build
npm run lint
python -m pytest tests\direct\test_mergeproof.py -v
genvm-lint check contracts\mergeproof.py
```

## Deploy

Keep deployment credentials only in the ignored root `.env`; `.env.example` contains placeholders.

```powershell
genlayer network testnet-bradbury
npm run deploy
```

After deployment, put the address in your local `frontend/.env`. Never commit a private key, seed phrase, or funded `.env` file.

## Limitations

- Only public canonical GitHub issue and pull-request URLs are accepted.
- GitHub availability and page rendering affect evidence quality; weak evidence requests revision instead of paying.
- Validators judge the visible diff and discussion. They do not execute arbitrary repository code.
- Sponsor cancellation is intentionally limited to `OPEN` and `REVISION_REQUESTED`; it is unavailable during evaluation or after release.

## License

MIT
