import assert from "node:assert/strict";
import test from "node:test";
import {
  auditBundleToMarkdown,
  classifyAuditFailure,
  createAuditBundle,
  recordAuditEvent,
  summarizeAudit,
  type TransactionAuditEntry,
} from "../lib/audit/transactionAudit.ts";

const base = {
  action: "RUN_JUDGMENT" as const,
  bountyId: "7",
  walletAddress: "0xabc",
  contractAddress: "0xcontract",
};

test("merges lifecycle events for the same transaction without calling accepted final", () => {
  let entries: TransactionAuditEntry[] = [];
  entries = recordAuditEvent(entries, {
    ...base,
    transactionHash: "0x123",
    phase: "SUBMITTED",
    at: "2026-08-29T10:00:00.000Z",
  });
  entries = recordAuditEvent(entries, {
    ...base,
    transactionHash: "0x123",
    phase: "ACCEPTED",
    at: "2026-08-29T10:01:00.000Z",
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].phase, "ACCEPTED");
  assert.equal(entries[0].finalizedAt, null);
  assert.equal(entries[0].history.length, 2);
  assert.deepEqual(summarizeAudit(entries), {
    totalAttempts: 1,
    submitted: 0,
    acceptedAwaitingFinality: 1,
    finalized: 0,
    attentionRequired: 0,
  });
});

test("finalization preserves the accepted timestamp and adds final evidence", () => {
  const accepted = recordAuditEvent([], {
    ...base,
    transactionHash: "0x456",
    phase: "ACCEPTED",
    at: "2026-08-29T10:01:00.000Z",
  });
  const finalized = recordAuditEvent(accepted, {
    ...base,
    transactionHash: "0x456",
    phase: "FINALIZED",
    at: "2026-08-29T10:31:00.000Z",
    detail: "Finalized ledger refreshed",
  });

  assert.equal(finalized[0].acceptedAt, "2026-08-29T10:01:00.000Z");
  assert.equal(finalized[0].finalizedAt, "2026-08-29T10:31:00.000Z");
  assert.equal(finalized[0].phase, "FINALIZED");
});

test("timeouts are marked undetermined while deterministic wallet errors are failed", () => {
  assert.equal(classifyAuditFailure(new Error("Timed out waiting for finalization receipt")), "UNDETERMINED");
  assert.equal(classifyAuditFailure(new Error("User rejected the request")), "FAILED");
});

test("evidence export reports accepted and finalized separately", () => {
  const entries = recordAuditEvent([], {
    ...base,
    transactionHash: "0x789",
    phase: "ACCEPTED",
    at: "2026-08-29T11:00:00.000Z",
  });
  const bundle = createAuditBundle({
    entries,
    contractAddress: "0xcontract",
    walletAddress: "0xabc",
    bountySnapshot: [],
    generatedAt: "2026-08-29T11:01:00.000Z",
  });
  const markdown = auditBundleToMarkdown(bundle);

  assert.match(markdown, /Accepted, awaiting finality: 1/);
  assert.match(markdown, /Finalized: 0/);
  assert.match(markdown, /https:\/\/explorer-bradbury\.genlayer\.com\/tx\/0x789/);
});
