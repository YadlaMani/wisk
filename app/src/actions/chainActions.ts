/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import {
  attestOnChain,
  collectProofs,
  explorerUrl,
  verifyOnChain,
} from "@/utils/chain";

export type OnChainVerification = {
  success: boolean;
  valid: boolean;
  results: { field: string; valid: boolean; nullifier?: string; error?: string }[];
  verifierAddress?: string;
  explorerUrl: string;
  message?: string;
};

/** Verifies every proof in a stored snark against the PdfVerifier contract. */
export async function verifySnarkOnChain(snark: any): Promise<OnChainVerification> {
  try {
    const proofs = Object.entries(collectProofs(snark));
    if (proofs.length === 0) {
      return {
        success: false,
        valid: false,
        results: [],
        explorerUrl,
        message: "No on-chain verifiable proofs found",
      };
    }

    const results = await Promise.all(
      proofs.map(async ([field, proof]) => {
        try {
          const values = await verifyOnChain(proof);
          return { field, valid: values.substringMatches, nullifier: values.nullifier };
        } catch (err: any) {
          return { field, valid: false, error: err?.shortMessage ?? String(err) };
        }
      })
    );

    return {
      success: true,
      valid: results.every((r) => r.valid),
      results,
      verifierAddress: process.env.PDF_VERIFIER_ADDRESS,
      explorerUrl,
    };
  } catch (err: any) {
    return { success: false, valid: false, results: [], explorerUrl, message: String(err) };
  }
}

/** Records every proof in a snark on-chain, returning the transaction hashes. */
export async function attestSnark(requestId: string, snark: any) {
  const hashes: string[] = [];
  if (!process.env.PDF_VERIFIER_ADDRESS || !process.env.RELAYER_PRIVATE_KEY) return hashes;
  for (const proof of Object.values(collectProofs(snark))) {
    hashes.push(await attestOnChain(requestId, proof));
  }
  return hashes;
}
