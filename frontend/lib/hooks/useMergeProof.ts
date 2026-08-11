"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MergeProofClient } from "../contracts/MergeProof";
import { getContractAddress, getStudioUrl } from "../genlayer/client";

export function useMergeProof(address?: string | null) {
  const contractAddress = getContractAddress();
  const client = useMemo(
    () => new MergeProofClient(contractAddress, address, getStudioUrl()),
    [address, contractAddress],
  );
  const queryClient = useQueryClient();
  const key = ["mergeproof", contractAddress];

  const bounties = useQuery({
    queryKey: key,
    queryFn: () => client.getBounties(),
    enabled: Boolean(contractAddress),
    refetchInterval: 12000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const createBounty = useMutation({
    mutationFn: (input: {
      title: string;
      issueUrl: string;
      acceptanceCriteria: string;
      value: bigint;
      onSubmitted?: (hash: string) => void;
    }) => client.createBounty(
      input.title,
      input.issueUrl,
      input.acceptanceCriteria,
      input.value,
      input.onSubmitted,
    ),
    onSuccess: refresh,
  });

  const submitWork = useMutation({
    mutationFn: (input: { id: string; pullRequestUrl: string; onSubmitted?: (hash: string) => void }) =>
      client.submitWork(input.id, input.pullRequestUrl, input.onSubmitted),
    onSuccess: refresh,
  });

  const evaluate = useMutation({
    mutationFn: (input: { id: string; onSubmitted?: (hash: string) => void }) =>
      client.evaluateSubmission(input.id, input.onSubmitted),
    onSuccess: refresh,
  });

  const withdraw = useMutation({
    mutationFn: (input: { id: string; onSubmitted?: (hash: string) => void }) =>
      client.withdrawSubmission(input.id, input.onSubmitted),
    onSuccess: refresh,
  });

  const cancel = useMutation({
    mutationFn: (input: { id: string; onSubmitted?: (hash: string) => void }) =>
      client.cancelBounty(input.id, input.onSubmitted),
    onSuccess: refresh,
  });

  return { contractAddress, bounties, createBounty, submitWork, evaluate, withdraw, cancel };
}
