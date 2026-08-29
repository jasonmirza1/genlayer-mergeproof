# Consensus Recovery & Audit

Implemented after MergeProof project approval on August 29, 2026, this milestone makes delayed or inconsistent network outcomes inspectable without changing the escrow contract or triggering another judgment.

## Problem

Bradbury exposes distinct transaction stages: submitted, accepted by validator consensus, and finalized. A write can reach `ACCEPTED` and still spend time in the finality window. A client timeout during that window does not prove the contract action failed. Treating an accepted transaction as either final success or safe-to-retry can create duplicate attempts and confusing evidence.

## Delivered behavior

The MergeProof frontend now records every contract write from the moment it receives a transaction hash. The audit entry is updated as the same hash moves through:

```text
SUBMITTED -> ACCEPTED -> FINALIZED
     |           |
     +-----------+-> UNDETERMINED (timeout or missing receipt)
     |
     +-> FAILED (deterministic wallet or transaction failure)
```

Tracked actions include:

- create bounty;
- submit work and immutable evidence locks;
- run validator judgment;
- withdraw a submission;
- refund escrow;
- recover a stuck submission.

Each record includes its Bradbury explorer URL, action, optional bounty ID, wallet, contract, last outcome, timestamps, detail, and full lifecycle history. Records are capped at 100 entries and stored locally under a key scoped to schema version, contract address, and connected wallet.

## Recovery semantics

- `SUBMITTED`: wait for validator consensus.
- `ACCEPTED`: consensus succeeded, but settlement is not final. Do not report payment completion yet.
- `FINALIZED`: the SDK reached finality and the finalized ledger refresh completed.
- `UNDETERMINED`: inspect the explorer and finalized contract state before deciding whether any retry is safe.
- `FAILED`: the wallet or transaction returned a deterministic failure.

This feature does not auto-repeat judgment, recreate bounties, withdraw submissions, or manufacture new ownership evidence.

## Evidence export

The Audit workspace exports:

- JSON with schema version, network, contract, wallet, summary, transaction histories, and the finalized bounty snapshot;
- Markdown with a reviewer-readable transaction table and explorer links.

The export explicitly counts `ACCEPTED` transactions awaiting finality separately from finalized transactions. Browser-local records are supporting evidence; Bradbury explorer and contract state remain authoritative.

## Verification

```powershell
cd frontend
npm run test:audit
npm run lint
npm run build
```

The audit unit suite verifies:

1. lifecycle events for one hash merge into one record;
2. accepted consensus is not labeled finalized;
3. finalization preserves the acceptance timestamp and adds final evidence;
4. timeout-like failures are classified as undetermined;
5. JSON/Markdown evidence preserves the accepted-versus-finalized distinction and explorer URL.

The production UI was also checked at desktop and 390-pixel mobile widths. No browser console errors were present.
