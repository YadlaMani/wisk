# WISK Contracts

`PdfVerifier` verifies SP1 Groth16 proofs of PDF claims on Ethereum and records each verified claim as an attestation. Proofs are checked through Succinct's [SP1VerifierGateway](https://github.com/succinctlabs/sp1-contracts/blob/main/contracts/src/SP1VerifierGateway.sol).

| Function | Type | Purpose |
| --- | --- | --- |
| `verifyPdfProof(publicValues, proofBytes)` | view | Verify a proof and return its public values |
| `attest(requestId, publicValues, proofBytes)` | transaction | Verify a proof and store an attestation; reverts if the text was not found or the nullifier was already used |
| `attestations(nullifier)` | view | Read a stored attestation |
| `getRequestNullifiers(requestId)` | view | List the attestations recorded for a request |

Each attestation emits `PdfClaimAttested(requestId, nullifier, signerKeyHash, substringHash, messageDigestHash, submitter)`.

## Requirements

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

```sh
forge install --no-git foundry-rs/forge-std@v1.9.4 succinctlabs/sp1-contracts@v5.0.0
```

## Test

```sh
forge test -v
```

## Deployment

| Network | Contract | Address |
| --- | --- | --- |
| Sepolia | `PdfVerifier` | `<PDF_VERIFIER_ADDRESS>` |
| Sepolia / Ethereum | SP1 Verifier Gateway (Groth16) | `0x397A5f7f3dBd538f23DE225B51f532c34448dA9B` |

1. Get the program verification key:

   ```sh
   cd ../script && cargo run --release --bin vkey
   # 0x0053195ac71360b9b760f63d1a2f659d28cf381c39598c42d79e17ef8b6ea224
   ```

2. Deploy:

   ```sh
   PROGRAM_VKEY=0x0053195ac71360b9b760f63d1a2f659d28cf381c39598c42d79e17ef8b6ea224 \
   forge script script/DeployPdfVerifier.s.sol \
     --rpc-url $ETH_RPC_URL --private-key $RELAYER_PRIVATE_KEY --broadcast
   ```

   Set `SP1_VERIFIER_GATEWAY` to override the gateway address.

3. Set `PDF_VERIFIER_ADDRESS` in `app/.env` to the deployed address.
