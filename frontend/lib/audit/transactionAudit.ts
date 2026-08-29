export const AUDIT_SCHEMA_VERSION = 1;
export const AUDIT_ENTRY_LIMIT = 100;

export type AuditPhase =
  | "SUBMITTED"
  | "ACCEPTED"
  | "FINALIZED"
  | "UNDETERMINED"
  | "FAILED";

export type AuditAction =
  | "CREATE_BOUNTY"
  | "SUBMIT_WORK"
  | "RUN_JUDGMENT"
  | "WITHDRAW_SUBMISSION"
  | "REFUND_ESCROW"
  | "RECOVER_SUBMISSION";

export interface AuditEvent {
  phase: AuditPhase;
  at: string;
  detail?: string;
}

export interface TransactionAuditEntry {
  id: string;
  transactionHash: string;
  action: AuditAction;
  bountyId: string | null;
  walletAddress: string | null;
  contractAddress: string;
  network: "Bradbury";
  explorerUrl: string | null;
  phase: AuditPhase;
  submittedAt: string;
  acceptedAt: string | null;
  finalizedAt: string | null;
  updatedAt: string;
  detail: string;
  history: AuditEvent[];
}

export interface RecordAuditEventInput {
  transactionHash?: string;
  action: AuditAction;
  bountyId?: string | null;
  walletAddress?: string | null;
  contractAddress: string;
  phase: AuditPhase;
  at?: string;
  detail?: string;
}

export interface AuditBountySnapshot {
  id: string;
  title: string;
  status: string;
  verdict: string;
  lockedPrCommit: string;
  lockedGistRevision: string;
  submittedAt: number;
  recoveryAt: number;
}

export interface AuditBundle {
  schemaVersion: number;
  generatedAt: string;
  application: "MergeProof";
  network: "Bradbury";
  contractAddress: string;
  walletAddress: string | null;
  summary: ReturnType<typeof summarizeAudit>;
  transactions: TransactionAuditEntry[];
  bountySnapshot: AuditBountySnapshot[];
}

const EXPLORER_URL = "https://explorer-bradbury.genlayer.com";

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE_BOUNTY: "Create bounty",
  SUBMIT_WORK: "Submit work",
  RUN_JUDGMENT: "Run validator judgment",
  WITHDRAW_SUBMISSION: "Withdraw submission",
  REFUND_ESCROW: "Refund escrow",
  RECOVER_SUBMISSION: "Recover stuck submission",
};

export function actionLabel(action: AuditAction): string {
  return ACTION_LABELS[action];
}

export function auditStorageKey(contractAddress: string, walletAddress?: string | null): string {
  const contract = contractAddress.trim().toLowerCase() || "unconfigured";
  const wallet = walletAddress?.trim().toLowerCase() || "disconnected";
  return `mergeproof:transaction-audit:v${AUDIT_SCHEMA_VERSION}:${contract}:${wallet}`;
}

function localEventId(at: string): string {
  return `local-${at}-${Math.random().toString(16).slice(2)}`;
}

function normalizeDetail(detail?: string): string {
  return (detail || "").trim().slice(0, 500);
}

export function recordAuditEvent(
  entries: TransactionAuditEntry[],
  input: RecordAuditEventInput,
): TransactionAuditEntry[] {
  const at = input.at || new Date().toISOString();
  const transactionHash = (input.transactionHash || "").trim();
  const id = transactionHash || localEventId(at);
  const detail = normalizeDetail(input.detail);
  const existingIndex = transactionHash
    ? entries.findIndex((entry) => entry.transactionHash.toLowerCase() === transactionHash.toLowerCase())
    : -1;
  const existing = existingIndex >= 0 ? entries[existingIndex] : null;
  const event: AuditEvent = { phase: input.phase, at, ...(detail ? { detail } : {}) };

  const next: TransactionAuditEntry = existing
    ? {
        ...existing,
        action: input.action,
        bountyId: input.bountyId ?? existing.bountyId,
        walletAddress: input.walletAddress ?? existing.walletAddress,
        contractAddress: input.contractAddress || existing.contractAddress,
        phase: input.phase,
        acceptedAt: input.phase === "ACCEPTED" ? at : existing.acceptedAt,
        finalizedAt: input.phase === "FINALIZED" ? at : existing.finalizedAt,
        updatedAt: at,
        detail: detail || existing.detail,
        history: [...existing.history, event],
      }
    : {
        id,
        transactionHash,
        action: input.action,
        bountyId: input.bountyId ?? null,
        walletAddress: input.walletAddress ?? null,
        contractAddress: input.contractAddress,
        network: "Bradbury",
        explorerUrl: transactionHash ? `${EXPLORER_URL}/tx/${transactionHash}` : null,
        phase: input.phase,
        submittedAt: at,
        acceptedAt: input.phase === "ACCEPTED" ? at : null,
        finalizedAt: input.phase === "FINALIZED" ? at : null,
        updatedAt: at,
        detail,
        history: [event],
      };

  const withoutExisting = existingIndex >= 0
    ? entries.filter((_, index) => index !== existingIndex)
    : entries;

  return [next, ...withoutExisting]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, AUDIT_ENTRY_LIMIT);
}

export function classifyAuditFailure(error: unknown): "UNDETERMINED" | "FAILED" {
  const message = error instanceof Error ? error.message : String(error || "");
  return /timeout|timed out|finali[sz]|receipt|retry|consensus|undetermined|pending/i.test(message)
    ? "UNDETERMINED"
    : "FAILED";
}

export function summarizeAudit(entries: TransactionAuditEntry[]) {
  return {
    totalAttempts: entries.length,
    submitted: entries.filter((entry) => entry.phase === "SUBMITTED").length,
    acceptedAwaitingFinality: entries.filter((entry) => entry.phase === "ACCEPTED").length,
    finalized: entries.filter((entry) => entry.phase === "FINALIZED").length,
    attentionRequired: entries.filter((entry) => ["UNDETERMINED", "FAILED"].includes(entry.phase)).length,
  };
}

export function createAuditBundle(input: {
  entries: TransactionAuditEntry[];
  contractAddress: string;
  walletAddress?: string | null;
  bountySnapshot: AuditBountySnapshot[];
  generatedAt?: string;
}): AuditBundle {
  return {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    generatedAt: input.generatedAt || new Date().toISOString(),
    application: "MergeProof",
    network: "Bradbury",
    contractAddress: input.contractAddress,
    walletAddress: input.walletAddress ?? null,
    summary: summarizeAudit(input.entries),
    transactions: input.entries,
    bountySnapshot: input.bountySnapshot,
  };
}

function markdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

export function auditBundleToMarkdown(bundle: AuditBundle): string {
  const lines = [
    "# MergeProof consensus recovery evidence",
    "",
    `- Generated: ${bundle.generatedAt}`,
    `- Network: ${bundle.network}`,
    `- Contract: ${bundle.contractAddress || "Not configured"}`,
    `- Wallet: ${bundle.walletAddress || "Not connected"}`,
    `- Attempts: ${bundle.summary.totalAttempts}`,
    `- Finalized: ${bundle.summary.finalized}`,
    `- Accepted, awaiting finality: ${bundle.summary.acceptedAwaitingFinality}`,
    `- Attention required: ${bundle.summary.attentionRequired}`,
    "",
    "## Transaction lifecycle",
    "",
    "| Action | Bounty | Outcome | Transaction | Updated | Detail |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const entry of bundle.transactions) {
    const tx = entry.explorerUrl
      ? `[${entry.transactionHash}](${entry.explorerUrl})`
      : "No transaction hash";
    lines.push(
      `| ${markdownCell(actionLabel(entry.action))} | ${entry.bountyId || "—"} | ${entry.phase} | ${tx} | ${entry.updatedAt} | ${markdownCell(entry.detail || "—")} |`,
    );
  }

  if (bundle.transactions.length === 0) {
    lines.push("| No recorded transactions | — | — | — | — | — |");
  }

  lines.push("", "## Finalized contract snapshot", "");
  for (const bounty of bundle.bountySnapshot) {
    lines.push(
      `- Bounty #${bounty.id}: ${bounty.title} — ${bounty.status}${bounty.verdict ? ` (${bounty.verdict})` : ""}`,
    );
  }
  if (bundle.bountySnapshot.length === 0) lines.push("- No bounties returned by the finalized ledger.");

  lines.push(
    "",
    "> Accepted consensus and finalized settlement are intentionally reported as separate states. This browser-local record is supporting evidence; the Bradbury explorer remains authoritative.",
    "",
  );
  return lines.join("\n");
}
