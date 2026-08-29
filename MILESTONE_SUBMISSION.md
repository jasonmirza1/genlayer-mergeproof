# MergeProof Consensus Recovery & Audit Milestone

## Portal fields

**Contribution type:** Builder -> Milestones

**Linked project:** MergeProof

**Contribution date:** August 29, 2026

**Title:** MergeProof - Consensus Recovery & Audit Dashboard

**Notes / Description (under 1,000 characters):**

MergeProof now includes a persistent Consensus Recovery & Audit workspace for every contract write. It records submission, validator acceptance, finalization, deterministic failure, and network-undetermined outcomes while keeping ACCEPTED visibly separate from FINALIZED. Each entry preserves the action, bounty ID, wallet, contract, Bradbury explorer link, timestamps, details, and complete lifecycle history. Timeout-aware guidance tells users to inspect explorer and finalized contract state before retrying, preventing blind duplicate judgments. Reviewers can export JSON or Markdown evidence containing transaction histories, outcome counts, explorer links, and the current finalized bounty snapshot. Records are capped, browser-local, and scoped to the connected wallet and contract. Added 4 lifecycle/export tests; TypeScript, production build, 21 contract regressions, and GenVM lint all pass. Implemented and deployed after MergeProof approval.

## Evidence links

Add these as separate evidence items:

1. **GitHub commit**
   https://github.com/jasonmirza1/genlayer-mergeproof/commit/dabcfc5f3c20257e5ae741b61b5aaae65fd52087

2. **Before/after comparison (approved baseline to milestone)**
   https://github.com/jasonmirza1/genlayer-mergeproof/compare/d4891af471411126cf16a6944a3f780f016425e0...dabcfc5f3c20257e5ae741b61b5aaae65fd52087

3. **Live deployed app**
   https://genlayer-mergeproof.vercel.app

4. **Milestone architecture and verification document**
   https://github.com/jasonmirza1/genlayer-mergeproof/blob/dabcfc5f3c20257e5ae741b61b5aaae65fd52087/docs/CONSENSUS_RECOVERY_AUDIT.md

5. **Audit lifecycle tests**
   https://github.com/jasonmirza1/genlayer-mergeproof/blob/dabcfc5f3c20257e5ae741b61b5aaae65fd52087/frontend/tests/transactionAudit.test.ts

6. **Audit engine**
   https://github.com/jasonmirza1/genlayer-mergeproof/blob/dabcfc5f3c20257e5ae741b61b5aaae65fd52087/frontend/lib/audit/transactionAudit.ts

7. **Audit dashboard**
   https://github.com/jasonmirza1/genlayer-mergeproof/blob/dabcfc5f3c20257e5ae741b61b5aaae65fd52087/frontend/components/TransactionAuditDashboard.tsx

## Reviewer path

1. Open the live app and select **Audit**.
2. Confirm the summary treats **Accepted, not final** and **Finalized** as different outcomes.
3. Inspect the audit engine and verify events for one transaction hash merge into one bounded record.
4. Inspect the dashboard and verify JSON/Markdown exports include the finalized bounty snapshot and explorer links.
5. Run:

```powershell
cd frontend
npm run test:audit
npm run lint
npm run build
cd ..
python -m pytest tests\direct\test_mergeproof.py -v
python -X utf8 -m genvm_linter.cli check contracts\mergeproof.py
```

## Verified results

- Audit lifecycle/export tests: **4 passed**
- Contract regression tests: **21 passed**
- TypeScript: **passed**
- Production build: **passed**
- GenVM lint and contract validation: **passed**
- Desktop and 390px mobile visual checks: **passed**
- Live production check: **passed**, no browser console errors
- Vercel deployment: `dpl_CTdUVaDwrdDraAeNWHx2MbVUC5L1` (`READY`)

## Scope note

This milestone is new work committed on August 29, 2026, after MergeProof was approved on August 25, 2026. It does not reuse the pre-approval Evidence Lock implementation as milestone work, change payout rules, rerun judgment, recreate a bounty, withdraw a submission, create a Gist, or redeploy the unchanged Intelligent Contract.
