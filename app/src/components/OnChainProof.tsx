"use client";

import { ExternalLink, Link2 } from "lucide-react";
import type { OnChainVerification } from "@/actions/chainActions";

const explorer =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://sepolia.etherscan.io";

const short = (value: string) => `${value.slice(0, 10)}…${value.slice(-8)}`;

export default function OnChainProof({
  attestationTxs,
  verification,
}: {
  attestationTxs?: string[];
  verification: OnChainVerification | null;
}) {
  const txs = attestationTxs ?? [];
  if (txs.length === 0 && !verification) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3 text-sm">
      <div className="flex items-center font-medium text-foreground">
        <Link2 className="h-4 w-4 mr-2 text-primary" />
        Verified on Ethereum
      </div>

      {txs.length > 0 && (
        <div className="space-y-1">
          <p className="text-muted-foreground">Attestation transactions</p>
          {txs.map((tx) => (
            <a
              key={tx}
              href={`${explorer}/tx/${tx}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center font-mono text-xs text-primary hover:underline"
            >
              {short(tx)}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          ))}
        </div>
      )}

      {verification && (
        <div className="space-y-1">
          {verification.verifierAddress && (
            <a
              href={`${verification.explorerUrl}/address/${verification.verifierAddress}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center text-xs text-primary hover:underline"
            >
              Verifier contract {short(verification.verifierAddress)}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
          {verification.results.map((r) => (
            <p key={r.field} className="text-xs font-mono">
              {r.valid ? "✓" : "✗"} {r.field}
              {r.error ? ` — ${r.error}` : ""}
            </p>
          ))}
          {verification.message && (
            <p className="text-xs text-destructive">{verification.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
