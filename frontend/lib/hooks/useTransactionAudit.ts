"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  auditStorageKey,
  recordAuditEvent,
  summarizeAudit,
  type RecordAuditEventInput,
  type TransactionAuditEntry,
} from "@/lib/audit/transactionAudit";

function readEntries(key: string): TransactionAuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function useTransactionAudit(contractAddress: string, walletAddress?: string | null) {
  const storageKey = useMemo(
    () => auditStorageKey(contractAddress, walletAddress),
    [contractAddress, walletAddress],
  );
  const [entries, setEntries] = useState<TransactionAuditEntry[]>([]);

  useEffect(() => {
    setEntries(readEntries(storageKey));
  }, [storageKey]);

  const record = useCallback((input: Omit<RecordAuditEventInput, "contractAddress" | "walletAddress">) => {
    setEntries((current) => {
      const next = recordAuditEvent(current, {
        ...input,
        contractAddress,
        walletAddress,
      });
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [contractAddress, storageKey, walletAddress]);

  const summary = useMemo(() => summarizeAudit(entries), [entries]);

  return { entries, record, summary };
}
