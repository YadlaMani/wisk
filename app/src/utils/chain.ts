import "server-only";
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";

export const pdfVerifierAbi = [
  {
    type: "function",
    name: "verifyPdfProof",
    stateMutability: "view",
    inputs: [
      { name: "_publicValues", type: "bytes" },
      { name: "_proofBytes", type: "bytes" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "substringMatches", type: "bool" },
          { name: "messageDigestHash", type: "bytes32" },
          { name: "signerKeyHash", type: "bytes32" },
          { name: "substringHash", type: "bytes32" },
          { name: "nullifier", type: "bytes32" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "attest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_requestId", type: "bytes32" },
      { name: "_publicValues", type: "bytes" },
      { name: "_proofBytes", type: "bytes" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "attestations",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "requestId", type: "bytes32" },
      { name: "signerKeyHash", type: "bytes32" },
      { name: "substringHash", type: "bytes32" },
      { name: "messageDigestHash", type: "bytes32" },
      { name: "submitter", type: "address" },
      { name: "timestamp", type: "uint64" },
    ],
  },
] as const;

export type OnChainProof = { publicValues: Hex; proofBytes: Hex };

const chain = process.env.ETH_CHAIN === "mainnet" ? mainnet : sepolia;

export const explorerUrl =
  chain.blockExplorers?.default.url ?? "https://sepolia.etherscan.io";

function verifierAddress(): Hex {
  const address = process.env.PDF_VERIFIER_ADDRESS;
  if (!address) throw new Error("PDF_VERIFIER_ADDRESS is not set");
  return address as Hex;
}

const publicClient = createPublicClient({
  chain,
  transport: http(process.env.ETH_RPC_URL),
});

/** Maps a verification request id to the bytes32 id recorded on-chain. */
export function toRequestId(id: string): Hex {
  return keccak256(toHex(id));
}

/** Pulls every SP1 proof out of a stored snark (single proof or `{ xProof: ... }` bundle). */
export function collectProofs(snark: unknown): Record<string, OnChainProof> {
  const parsed = typeof snark === "string" ? JSON.parse(snark) : snark;
  if (!parsed || typeof parsed !== "object") return {};
  const isProof = (p: any): p is OnChainProof =>
    p && typeof p.publicValues === "string" && typeof p.proofBytes === "string";

  if (isProof(parsed)) return { proof: parsed };
  return Object.fromEntries(
    Object.entries(parsed).filter(([, value]) => isProof(value))
  ) as Record<string, OnChainProof>;
}

/** Verifies a proof against the PdfVerifier contract with a free `eth_call`. */
export async function verifyOnChain(proof: OnChainProof) {
  const values = await publicClient.readContract({
    address: verifierAddress(),
    abi: pdfVerifierAbi,
    functionName: "verifyPdfProof",
    args: [proof.publicValues, proof.proofBytes],
  });
  return values;
}

/** Records a proof as an on-chain attestation and returns the transaction hash. */
export async function attestOnChain(requestId: string, proof: OnChainProof) {
  const key = process.env.RELAYER_PRIVATE_KEY;
  if (!key) throw new Error("RELAYER_PRIVATE_KEY is not set");

  const walletClient = createWalletClient({
    account: privateKeyToAccount(key as Hex),
    chain,
    transport: http(process.env.ETH_RPC_URL),
  });

  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: verifierAddress(),
    abi: pdfVerifierAbi,
    functionName: "attest",
    args: [toRequestId(requestId), proof.publicValues, proof.proofBytes],
  });
  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Attestation ${hash} reverted`);
  return hash;
}
