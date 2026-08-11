import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN, getEthereumProvider } from "../genlayer/client";
import {
  estimateWriteFeePreset,
  feePresetToTransactionFees,
} from "../genlayer/fees";
import type { Bounty, BountyStatus, TransactionReceipt } from "./types";

function toPlainObject(value: any): any {
  if (value instanceof Map) {
    return Array.from(value.entries()).reduce((result: Record<string, any>, [key, item]) => {
      result[String(key)] = toPlainObject(item);
      return result;
    }, {});
  }
  if (Array.isArray(value)) return value.map(toPlainObject);
  return value;
}
function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [value];
  }
}

function normalizeBounty(raw: any): Bounty | null {
  const bounty = toPlainObject(raw);
  if (!bounty || Object.keys(bounty).length === 0) return null;

  return {
    id: String(bounty.id ?? ""),
    sponsor: String(bounty.sponsor ?? ""),
    worker: String(bounty.worker ?? ""),
    title: String(bounty.title ?? ""),
    issue_url: String(bounty.issue_url ?? ""),
    pull_request_url: String(bounty.pull_request_url ?? ""),
    acceptance_criteria: String(bounty.acceptance_criteria ?? ""),
    amount: BigInt(bounty.amount ?? 0),
    status: String(bounty.status ?? "OPEN") as BountyStatus,
    verdict: String(bounty.verdict ?? ""),
    evidence_summary: String(bounty.evidence_summary ?? ""),
    unmet_criteria: parseList(bounty.unmet_criteria),
  };
}

function assertSuccessfulTransaction(receipt: any): void {
  const statusName = receipt?.statusName ?? receipt?.status_name;
  if (statusName && statusName !== "ACCEPTED" && statusName !== "FINALIZED") {
    throw new Error(`Transaction ended with status ${statusName}.`);
  }

  const resultName = receipt?.resultName ?? receipt?.result_name;
  if (resultName && resultName !== "AGREE" && resultName !== "MAJORITY_AGREE") {
    throw new Error(`Validators did not accept the transaction (${resultName}).`);
  }

  const consensus = receipt?.consensus_data ?? receipt?.consensusData;
  const leaders = consensus?.leader_receipt ?? consensus?.leaderReceipt ?? [];
  const values = [
    receipt?.txExecutionResultName,
    receipt?.executionResultName,
    receipt?.execution_result,
    ...(Array.isArray(leaders) ? leaders : [leaders]).flatMap((entry: any) => [
      entry?.txExecutionResultName,
      entry?.executionResultName,
      entry?.execution_result,
    ]),
  ].filter((value): value is string => typeof value === "string");

  if (values.some((value) => value === "ERROR" || value === "FINISHED_WITH_ERROR")) {
    throw new Error("The transaction was accepted but contract execution failed.");
  }
}

export class MergeProofClient {
  private contractAddress: `0x${string}`;
  private client: any;
  private endpoint?: string;

  constructor(contractAddress: string, address?: string | null, endpoint?: string) {
    this.contractAddress = contractAddress as `0x${string}`;
    this.endpoint = endpoint;
    const config: any = { chain: GENLAYER_CHAIN };
    if (address) {
      config.account = address as `0x${string}`;
      const provider = getEthereumProvider();
      if (provider) config.provider = provider;
    }
    if (endpoint) config.endpoint = endpoint;
    this.client = createClient(config);
  }

  private async write(
    functionName: string,
    args: unknown[],
    value: bigint,
    onSubmitted?: (hash: string) => void,
  ): Promise<TransactionReceipt> {
    const estimate = await estimateWriteFeePreset(
      this.client,
      { address: this.contractAddress, functionName, args, value },
      "standard",
    );
    const fees = feePresetToTransactionFees(estimate);
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName,
      args,
      value,
      ...(fees ? { fees } : {}),
    });
    onSubmitted?.(hash);

    const receipt = await this.client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED" as any,
      retries: 180,
      interval: 5000,
    });
    assertSuccessfulTransaction(receipt);
    return receipt as TransactionReceipt;
  }

  createBounty(
    title: string,
    issueUrl: string,
    acceptanceCriteria: string,
    value: bigint,
    onSubmitted?: (hash: string) => void,
  ) {
    return this.write(
      "create_bounty",
      [title, issueUrl, acceptanceCriteria],
      value,
      onSubmitted,
    );
  }

  submitWork(bountyId: string, pullRequestUrl: string, onSubmitted?: (hash: string) => void) {
    return this.write("submit_work", [bountyId, pullRequestUrl], 0n, onSubmitted);
  }

  evaluateSubmission(bountyId: string, onSubmitted?: (hash: string) => void) {
    return this.write("evaluate_submission", [bountyId], 0n, onSubmitted);
  }

  cancelBounty(bountyId: string, onSubmitted?: (hash: string) => void) {
    return this.write("cancel_bounty", [bountyId], 0n, onSubmitted);
  }

  async getBounties(): Promise<Bounty[]> {
    const count = await this.getBountyCount();
    if (count === 0) return [];
    const start = Math.max(0, count - 25);
    const raw = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_bounties",
      args: [start, Math.min(25, count)],
    });
    const values = Array.isArray(raw) ? raw : Array.from(raw?.values?.() ?? []);
    return values.map(normalizeBounty).filter((value): value is Bounty => Boolean(value)).reverse();
  }

  async getBountyCount(): Promise<number> {
    const count = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_bounty_count",
      args: [],
    });
    return Number(count) || 0;
  }
}
