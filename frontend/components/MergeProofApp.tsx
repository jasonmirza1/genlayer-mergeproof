"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  GitPullRequest,
  LoaderCircle,
  Plus,
  RefreshCw,
  Scale,
  Undo2,
} from "lucide-react";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";
import { useWallet } from "@/lib/genlayer/wallet";
import { useMergeProof } from "@/lib/hooks/useMergeProof";
import type { Bounty, BountyStatus } from "@/lib/contracts/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

const EXPLORER_URL = "https://explorer-bradbury.genlayer.com";

const statusLabel: Record<BountyStatus, string> = {
  OPEN: "Open",
  SUBMITTED: "Under review",
  REVISION_REQUESTED: "Revision requested",
  RELEASED: "Paid",
  REFUNDED: "Refunded",
};

function compact(value: string, size = 8) {
  if (!value) return "Not assigned";
  if (value.length <= size * 2) return value;
  return `${value.slice(0, size)}...${value.slice(-size)}`;
}
function genAmount(amount: bigint) {
  const formatted = Number(formatEther(amount));
  return `${formatted.toLocaleString(undefined, { maximumFractionDigits: 4 })} GEN`;
}

function transactionHash(receipt: any): string {
  return receipt?.hash || receipt?.transactionHash || receipt?.txHash || "";
}

function StatusBadge({ status }: { status: BountyStatus }) {
  return <Badge className={`status-badge status-${status.toLowerCase()}`}>{statusLabel[status]}</Badge>;
}

function BountyRow({
  bounty,
  address,
  busy,
  onSubmit,
  onEvaluate,
  onCancel,
}: {
  bounty: Bounty;
  address: string | null;
  busy: boolean;
  onSubmit: (id: string, pullRequestUrl: string) => void;
  onEvaluate: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [pullRequestUrl, setPullRequestUrl] = useState("");
  const sponsor = Boolean(address && bounty.sponsor.toLowerCase() === address.toLowerCase());
  const acceptsWork = bounty.status === "OPEN" || bounty.status === "REVISION_REQUESTED";

  return (
    <article className="bounty-row">
      <div className="bounty-heading">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="bounty-id">#{bounty.id}</span>
            <StatusBadge status={bounty.status} />
          </div>
          <h3>{bounty.title}</h3>
        </div>
        <div className="bounty-value">
          <span>Escrow</span>
          <strong>{genAmount(bounty.amount)}</strong>
        </div>
      </div>

      <div className="bounty-grid">
        <div>
          <span className="field-label">Sponsor</span>
          <p className="mono">{compact(bounty.sponsor)}</p>
        </div>
        <div>
          <span className="field-label">Developer</span>
          <p className="mono">{compact(bounty.worker)}</p>
        </div>
        <div>
          <span className="field-label">Evidence</span>
          <div className="evidence-links">
            <a href={bounty.issue_url} target="_blank" rel="noreferrer">
              Issue <ArrowUpRight />
            </a>
            {bounty.pull_request_url && (
              <a href={bounty.pull_request_url} target="_blank" rel="noreferrer">
                Pull request <ArrowUpRight />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="criteria-block">
        <span className="field-label">Acceptance criteria</span>
        <p>{bounty.acceptance_criteria}</p>
      </div>

      {bounty.evidence_summary && (
        <div className="judgment-block">
          <div>
            <Scale />
            <span>Validator judgment</span>
          </div>
          <p>{bounty.evidence_summary}</p>
          {bounty.unmet_criteria.length > 0 && (
            <ul>
              {bounty.unmet_criteria.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </div>
      )}

      {acceptsWork && !sponsor && address && (
        <div className="action-line">
          <Input
            value={pullRequestUrl}
            onChange={(event) => setPullRequestUrl(event.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            aria-label="Pull request URL"
          />
          <Button
            onClick={() => onSubmit(bounty.id, pullRequestUrl)}
            disabled={busy || !pullRequestUrl.trim()}
          >
            <GitPullRequest /> Submit work
          </Button>
        </div>
      )}

      <div className="row-actions">
        {bounty.status === "SUBMITTED" && address && (
          <Button onClick={() => onEvaluate(bounty.id)} disabled={busy}>
            <Scale /> Run judgment
          </Button>
        )}
        {acceptsWork && sponsor && (
          <Button variant="outline" onClick={() => onCancel(bounty.id)} disabled={busy}>
            <Undo2 /> Refund escrow
          </Button>
        )}
      </div>
    </article>
  );
}

export function MergeProofApp() {
  const { address, isConnected, isOnCorrectNetwork } = useWallet();
  const { contractAddress, bounties, createBounty, submitWork, evaluate, cancel } = useMergeProof(address);
  const [view, setView] = useState<"bounties" | "create">("bounties");
  const [title, setTitle] = useState("");
  const [issueUrl, setIssueUrl] = useState("");
  const [criteria, setCriteria] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [lastTx, setLastTx] = useState("");

  const items = bounties.data ?? [];
  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => ["OPEN", "SUBMITTED", "REVISION_REQUESTED"].includes(item.status)).length,
    paid: items.filter((item) => item.status === "RELEASED").length,
  }), [items]);
  const busy = createBounty.isPending || submitWork.isPending || evaluate.isPending || cancel.isPending;

  const capture = (hash: string) => {
    setLastTx(hash);
    toast.info("Transaction submitted", { description: "Waiting for GenLayer consensus." });
  };

  const finish = (receipt: any, message: string) => {
    const hash = transactionHash(receipt);
    if (hash) setLastTx(hash);
    toast.success(message);
  };

  const fail = (error: any) => toast.error("Transaction failed", {
    description: error?.message || "Check the wallet and try again.",
  });

  const handleCreate = async () => {
    try {
      const value = parseEther(amount || "0");
      const receipt = await createBounty.mutateAsync({
        title,
        issueUrl,
        acceptanceCriteria: criteria,
        value,
        onSubmitted: capture,
      });
      finish(receipt, "Bounty funded and published");
      setTitle("");
      setIssueUrl("");
      setCriteria("");
      setView("bounties");
    } catch (error) {
      fail(error);
    }
  };

  const canWrite = isConnected && isOnCorrectNetwork && Boolean(contractAddress);

  return (
    <main className="app-shell">
      <section className="workspace-header">
        <div>
          <p className="eyebrow"><FileCheck2 /> GitHub delivery escrow</p>
          <h1>MergeProof</h1>
          <p className="workspace-summary">Bounties settle against live issue and pull-request evidence.</p>
        </div>
        <div className="network-chip">
          <span className={isOnCorrectNetwork ? "network-dot online" : "network-dot"} />
          {isOnCorrectNetwork ? "Bradbury connected" : "Bradbury required"}
        </div>
      </section>

      <section className="stats-strip" aria-label="Bounty statistics">
        <div><span>Total bounties</span><strong>{stats.total}</strong></div>
        <div><span>Active</span><strong>{stats.active}</strong></div>
        <div><span>Paid</span><strong>{stats.paid}</strong></div>
        <div className="contract-stat"><span>Contract</span><strong className="mono">{contractAddress ? compact(contractAddress, 7) : "Not deployed"}</strong></div>
      </section>

      {!contractAddress && (
        <div className="system-alert"><AlertTriangle /> Bradbury contract address is not configured.</div>
      )}

      <div className="toolbar">
        <div className="segmented-control" aria-label="Workspace view">
          <button className={view === "bounties" ? "active" : ""} onClick={() => setView("bounties")}>Bounties</button>
          <button className={view === "create" ? "active" : ""} onClick={() => setView("create")}><Plus /> New bounty</button>
        </div>
        <Button variant="outline" size="icon" onClick={() => bounties.refetch()} title="Refresh bounties">
          <RefreshCw className={bounties.isFetching ? "animate-spin" : ""} />
        </Button>
      </div>

      {view === "create" ? (
        <section className="create-workspace">
          <div className="section-heading">
            <div><span className="section-number">01</span><h2>Fund a verifiable bounty</h2></div>
            <CircleDollarSign />
          </div>
          <div className="form-grid">
            <div className="field-wide">
              <Label htmlFor="title">Bounty title</Label>
              <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add resilient URL validation" maxLength={120} />
            </div>
            <div>
              <Label htmlFor="issue">GitHub issue URL</Label>
              <Input id="issue" value={issueUrl} onChange={(event) => setIssueUrl(event.target.value)} placeholder="https://github.com/owner/repo/issues/12" />
            </div>
            <div>
              <Label htmlFor="amount">Escrow amount (GEN)</Label>
              <Input id="amount" type="number" min="0.0001" step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            <div className="field-wide">
              <Label htmlFor="criteria">Acceptance criteria</Label>
              <textarea
                id="criteria"
                value={criteria}
                onChange={(event) => setCriteria(event.target.value)}
                placeholder="List concrete deliverables, tests, documentation, and observable evidence required for approval."
                maxLength={2000}
                rows={7}
              />
              <span className="character-count">{criteria.length}/2000</span>
            </div>
          </div>
          <div className="create-actions">
            <Button variant="outline" onClick={() => setView("bounties")}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!canWrite || busy || !title.trim() || !issueUrl.trim() || criteria.trim().length < 20}
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <CircleDollarSign />}
              Fund bounty
            </Button>
          </div>
        </section>
      ) : (
        <section className="bounty-workspace">
          <div className="section-heading">
            <div><span className="section-number">02</span><h2>Live bounty ledger</h2></div>
            <GitPullRequest />
          </div>
          {bounties.isLoading ? (
            <div className="empty-state"><LoaderCircle className="animate-spin" /> Loading contract state</div>
          ) : items.length === 0 ? (
            <div className="empty-state"><FileCheck2 /><span>No bounties have been funded.</span></div>
          ) : (
            <div className="bounty-list">
              {items.map((bounty) => (
                <BountyRow
                  key={bounty.id}
                  bounty={bounty}
                  address={address}
                  busy={busy}
                  onSubmit={async (id, pullRequestUrl) => {
                    try {
                      const receipt = await submitWork.mutateAsync({ id, pullRequestUrl, onSubmitted: capture });
                      finish(receipt, "Pull request submitted");
                    } catch (error) { fail(error); }
                  }}
                  onEvaluate={async (id) => {
                    try {
                      const receipt = await evaluate.mutateAsync({ id, onSubmitted: capture });
                      finish(receipt, "Validator judgment completed");
                    } catch (error) { fail(error); }
                  }}
                  onCancel={async (id) => {
                    try {
                      const receipt = await cancel.mutateAsync({ id, onSubmitted: capture });
                      finish(receipt, "Escrow refund initiated");
                    } catch (error) { fail(error); }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {lastTx && (
        <a className="tx-banner" href={`${EXPLORER_URL}/tx/${lastTx}`} target="_blank" rel="noreferrer">
          <CheckCircle2 /> Latest transaction <span className="mono">{compact(lastTx, 9)}</span><ArrowUpRight />
        </a>
      )}
    </main>
  );
}
