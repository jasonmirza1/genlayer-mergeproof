export type BountyStatus =
  | "OPEN"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "RELEASED"
  | "REFUNDED";

export interface Bounty {
  id: string;
  sponsor: string;
  worker: string;
  title: string;
  issue_url: string;
  pull_request_url: string;
  ownership_proof_url: string;
  claimant_github: string;
  acceptance_criteria: string;
  amount: bigint;
  status: BountyStatus;
  verdict: string;
  evidence_summary: string;
  unmet_criteria: string[];
}
export interface TransactionReceipt {
  status?: string;
  hash?: string;
  transactionHash?: string;
  statusName?: string;
  status_name?: string;
  resultName?: string;
  result_name?: string;
  txExecutionResultName?: string;
  [key: string]: any;
}
