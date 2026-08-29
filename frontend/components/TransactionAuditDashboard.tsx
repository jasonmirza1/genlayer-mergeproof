"use client";

import { Activity, ArrowUpRight, CheckCircle2, Clock3, Download, ShieldAlert } from "lucide-react";
import type { Bounty } from "@/lib/contracts/types";
import {
  actionLabel,
  auditBundleToMarkdown,
  createAuditBundle,
  summarizeAudit,
  type TransactionAuditEntry,
} from "@/lib/audit/transactionAudit";
import { Button } from "./ui/button";

function compact(value: string, size = 8) {
  if (!value) return "Local event";
  if (value.length <= size * 2) return value;
  return `${value.slice(0, size)}...${value.slice(-size)}`;
}

function downloadEvidence(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function recoveryMessage(entry: TransactionAuditEntry) {
  if (entry.phase === "SUBMITTED") return "Waiting for validator consensus.";
  if (entry.phase === "ACCEPTED") return "Consensus accepted; settlement is not final yet.";
  if (entry.phase === "FINALIZED") return "Consensus outcome finalized and ledger refresh completed.";
  if (entry.phase === "UNDETERMINED") return "Check the explorer and finalized contract state before retrying.";
  return "The wallet or network rejected this attempt before a confirmed outcome.";
}

export function TransactionAuditDashboard({
  entries,
  contractAddress,
  walletAddress,
  bounties,
}: {
  entries: TransactionAuditEntry[];
  contractAddress: string;
  walletAddress: string | null;
  bounties: Bounty[];
}) {
  const summary = summarizeAudit(entries);
  const bundle = () => createAuditBundle({
    entries,
    contractAddress,
    walletAddress,
    bountySnapshot: bounties.map((bounty) => ({
      id: bounty.id,
      title: bounty.title,
      status: bounty.status,
      verdict: bounty.verdict,
      lockedPrCommit: bounty.locked_pr_commit,
      lockedGistRevision: bounty.locked_gist_revision,
      submittedAt: bounty.submitted_at,
      recoveryAt: bounty.recovery_at,
    })),
  });

  const exportJson = () => {
    const evidence = bundle();
    downloadEvidence(
      `mergeproof-audit-${Date.now()}.json`,
      JSON.stringify(evidence, null, 2),
      "application/json",
    );
  };

  const exportMarkdown = () => {
    const evidence = bundle();
    downloadEvidence(
      `mergeproof-audit-${Date.now()}.md`,
      auditBundleToMarkdown(evidence),
      "text/markdown",
    );
  };

  return (
    <section className="audit-workspace">
      <div className="section-heading audit-heading">
        <div><span className="section-number">03</span><h2>Consensus recovery &amp; audit</h2></div>
        <Activity />
      </div>

      <div className="audit-intro">
        <div>
          <ShieldAlert />
          <p><strong>Accepted is not finalized.</strong> Every write is tracked through submission, validator acceptance, and final settlement so a timeout does not erase what happened.</p>
        </div>
        <div className="audit-export-actions">
          <Button variant="outline" onClick={exportJson}><Download /> JSON evidence</Button>
          <Button variant="outline" onClick={exportMarkdown}><Download /> Markdown report</Button>
        </div>
      </div>

      <div className="audit-stats" aria-label="Transaction audit summary">
        <div><span>Attempts</span><strong>{summary.totalAttempts}</strong></div>
        <div><span>Awaiting consensus</span><strong>{summary.submitted}</strong></div>
        <div><span>Accepted, not final</span><strong>{summary.acceptedAwaitingFinality}</strong></div>
        <div><span>Finalized</span><strong>{summary.finalized}</strong></div>
        <div className={summary.attentionRequired ? "attention" : ""}><span>Needs attention</span><strong>{summary.attentionRequired}</strong></div>
      </div>

      <p className="audit-scope-note">
        Stored in this browser for the connected wallet and contract. Exports include the current finalized bounty snapshot; explorer records remain authoritative.
      </p>

      {entries.length === 0 ? (
        <div className="empty-state"><Activity /><span>No writes recorded in this browser yet.</span></div>
      ) : (
        <div className="audit-list">
          {entries.map((entry) => (
            <article className="audit-entry" key={entry.id}>
              <div className="audit-entry-main">
                <div className={`audit-phase phase-${entry.phase.toLowerCase()}`}>
                  {entry.phase === "FINALIZED" ? <CheckCircle2 /> : entry.phase === "ACCEPTED" ? <Clock3 /> : <Activity />}
                  {entry.phase.replaceAll("_", " ")}
                </div>
                <div>
                  <h3>{actionLabel(entry.action)}{entry.bountyId ? ` · Bounty #${entry.bountyId}` : ""}</h3>
                  <p>{recoveryMessage(entry)}</p>
                  {entry.detail && <p className="audit-detail">{entry.detail}</p>}
                </div>
              </div>
              <div className="audit-entry-meta">
                <span>{formatTime(entry.updatedAt)}</span>
                {entry.explorerUrl ? (
                  <a href={entry.explorerUrl} target="_blank" rel="noreferrer" className="mono">
                    {compact(entry.transactionHash)} <ArrowUpRight />
                  </a>
                ) : <span className="mono">No transaction hash</span>}
              </div>
              <ol className="audit-timeline" aria-label="Transaction lifecycle">
                {entry.history.map((event, index) => (
                  <li key={`${event.phase}-${event.at}-${index}`}>
                    <span />
                    <div><strong>{event.phase.replaceAll("_", " ")}</strong><small>{formatTime(event.at)}</small></div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
