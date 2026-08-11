"use client";

import { AccountPanel } from "@/components/AccountPanel";
import { MergeProofApp } from "@/components/MergeProofApp";
import { FileCheck2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-mark"><FileCheck2 /></span>
            <div><strong>MergeProof</strong><span>GenLayer Builder Project</span></div>
          </div>
          <AccountPanel />
        </div>
      </header>
      <MergeProofApp />
      <footer>
        <a href="https://genlayer.com" target="_blank" rel="noreferrer">GenLayer</a>
        <a href="https://explorer-bradbury.genlayer.com" target="_blank" rel="noreferrer">Bradbury Explorer</a>
        <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer">Documentation</a>
      </footer>
    </div>
  );
}
