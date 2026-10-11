# WISK: Trustless background verification with DigiLocker + SNARK proofs secure, private & employer-ready

> _Rethinking document verification from the ground up with zero-knowledge cryptography_

## 📖 Table of Contents

- [The Problem We Solved](#the-problem-we-solved)
- [Architecture Catalog](#architecture-catalog)
- [Technology Reference Guide](#technology-reference-guide)
- [Core Components Deep Dive](#core-components-deep-dive)
- [Frontend Implementation Guide](#frontend-implementation-guide)
- [Developer Documentation](#developer-documentation)
- [Setup & Deployment](#setup--deployment)
- [API Reference](#api-reference)
- [Security & Privacy](#security--privacy)
- [Performance Benchmarks](#performance-benchmarks)
- [Contributing](#contributing)
- [Resources & Links](#resources--links)

---

## The Problem We Solved

Background verification has always felt outdated. An employer asks for your documents, a third-party agency collects them, and suddenly your most personal information — your identity, your certificates, your government IDs — is sitting in someone else's database. It's inefficient, it's risky, and worst of all, it forces you to give up control of your own data.

We wanted to rethink this from the ground up. What if verification didn't require handing over documents at all? What if you could prove the truth of your records — without ever exposing them?

That's exactly what we built.

### How WISK Works

Here's how it works: when an employer wants to verify a candidate, they don't call a middleman. Instead, they send a simple request by email. The candidate receives that request and uploads their Digilocker-issued certificate — a government-signed PDF. The signature and the requested details are checked locally, right in the browser, and the document is never stored — only the proof is shared.

Our system uses **WebAssembly with zk-pdf** to parse the actual PDF bytes. It checks whether the requested details — like a name or PAN number — are present inside the document. At the same time, it validates the government's digital signature embedded in the PDF, making sure the document hasn't been edited or forged. If even a single byte is tampered with, the signature breaks and the verification fails.

Once everything checks out, we generate a **zero-knowledge SNARK proof**. This proof says, "Yes, this document is real. Yes, it's signed by the Government of India. Yes, it contains the requested details." And it does all of this without revealing the entire document. Only the facts the employer asked for are disclosed — nothing more.

Each proof is then **verified and recorded on Ethereum**. Our `PdfVerifier` contract checks the Groth16 proof through Succinct's SP1 verifier gateway and stores an attestation — the request ID, the hash of the government signing key, the hash of the proven text, and a nullifier that stops the same document from being replayed. The employer gets an email with a link to the result and can re-verify every proof against the contract with a single free `eth_call`, with mathematical certainty. No agencies, no central databases, no trust required — just pure cryptography. And because the attestations live on a public chain, anyone can independently verify them too.

### Why It's Revolutionary

What makes this powerful is **simplicity**. For the employee, it's just clicking a link in their inbox. For the employer, it's receiving an email with a verified result. Underneath, though, it's state-of-the-art cryptography ensuring privacy, authenticity, and tamper-proof verification.

No private data is stored anywhere. The entire codebase is open source, so anyone can audit how it works. And because it's tied to Digilocker, only official government-signed certificates are accepted. Fake or edited PDFs are instantly rejected.

**In short**: we turned background verification into a trustless, privacy-preserving experience. No middlemen. No leaks. Just cryptographic truth, delivered seamlessly through email.

---

## Architecture Catalog

WISK is architected as a multi-layered system that seamlessly integrates cryptographic primitives with modern web technologies. Each layer serves a specific purpose in the verification pipeline.

### 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    WISK Architecture                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Frontend      │    │   Prover        │    │  Blockchain │  │
│  │   (Next.js +    │◄──►│   Service       │◄──►│  Verifier   │  │
│  │   WebAssembly)  │    │   (Rust + SP1)  │    │  (Solidity) │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                      │      │
│           ▼                       ▼                      ▼      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   WASM PDF      │    │   ZK Circuits   │    │   Smart     │  │
│  │   Processing    │    │   (SP1 VM)      │    │   Contract  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Core PDF Libraries (Rust)                      ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐││
│  │  │ Signature   │ │    Text     │ │      Core Library       │││
│  │  │ Validator   │ │ Extractor   │ │   (Combined Ops)        │││
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 📚 Component Catalog

| Component             | Technology                       | Purpose                                | Reference                                               |
| --------------------- | -------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| **Frontend Layer**    | Next.js 15, TypeScript, Tailwind | User interface and workflow management | [Frontend Guide](#frontend-implementation-guide)        |
| **WebAssembly Layer** | Rust + wasm-bindgen              | Browser-side PDF processing            | [WASM Documentation](pdf-utils/wasm/README.md)          |
| **ZK Circuit Layer**  | SP1, Rust                        | Zero-knowledge proof generation        | [Circuit Documentation](circuits/README.md)             |
| **Prover Service**    | Axum, SP1 SDK                    | High-performance proof API             | [Prover Implementation](#prover-service-implementation) |
| **PDF Processing**    | Pure Rust                        | Document parsing and validation        | [PDF Utils Documentation](pdf-utils/README.md)          |
| **Smart Contracts**   | Solidity, Foundry                | On-chain proof verification            | [Contract Documentation](circuits/contracts/README.md)  |

---

## Technology Reference Guide

### 🔧 Core Technologies

#### Cryptographic Stack

- **[SP1 v6](https://docs.succinct.xyz/)** - Zero-knowledge virtual machine for SNARK generation (Groth16 proofs via the Succinct Prover Network)
- **[Ethereum](https://ethereum.org/)** - On-chain proof verification and attestations (`PdfVerifier` + SP1 verifier gateway)
- **[PKCS#7/CMS](https://tools.ietf.org/html/rfc5652)** - Digital signature verification standard
- **[RSA-PSS](https://tools.ietf.org/html/rfc3447)** - Cryptographic signature algorithms (SHA-256/SHA-1)
- **[WebAssembly](https://webassembly.org/)** - Browser-compatible cryptographic operations

#### Development Framework

- **[Rust](https://www.rust-lang.org/)** - Systems programming language for core logic
- **[Next.js 15](https://nextjs.org/)** - Full-stack React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[MongoDB](https://www.mongodb.com/)** - Document database for verification requests
- **[Node.js](https://nodejs.org/)** - JavaScript runtime for backend services

#### Specialized Libraries

- **[wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)** - Rust-WebAssembly bindings
- **[Axum](https://github.com/tokio-rs/axum)** - Async web framework for Rust
- **[Foundry](https://book.getfoundry.sh/)** - Solidity build, test and deployment
- **[viem](https://viem.sh/)** - TypeScript Ethereum client for on-chain verification and attestations
- **[PKI.js](https://pkijs.org/)** - JavaScript cryptographic library
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI components
- **[Lucide React](https://lucide.dev/)** - Icon library

---

## Core Components Deep Dive

### 📄 PDF Processing Layer (`pdf-utils/`)

The PDF processing system is built from scratch in pure Rust, avoiding heavy dependencies like OpenSSL or lopdf. This design ensures compatibility with zero-knowledge environments and provides a minimal attack surface.

#### Signature Validator (`signature-validator/`)

**Purpose**: Validates digital signatures in PDF documents using PKCS#7/CMS standards.

```rust
pub fn verify_pdf_signature(pdf_bytes: &[u8]) -> Result<PdfSignatureResult, String> {
    // Extract signature dictionary and ByteRange
    let signature_info = extract_signature_info(pdf_bytes)?;

    // Verify content integrity (Hash verification)
    let content_hash = calculate_content_hash(&signature_info)?;

    // Verify signature authenticity (RSA verification)
    let signature_valid = verify_rsa_signature(&signature_info)?;

    Ok(PdfSignatureResult {
        is_valid: content_hash && signature_valid,
        public_key: extract_public_key(&signature_info)?,
        message_digest: format_digest(&signature_info.digest)?,
    })
}
```

**Two-Stage Verification Process**:

1. **Content Integrity Check**

   - Extracts `signed_bytes` using PDF's `ByteRange`
   - Calculates cryptographic hash (SHA-256/SHA-1/SHA-384/SHA-512)
   - Mathematical verification: `Hash(signed_bytes) == MessageDigest`

2. **Signature Authenticity Check**
   - Extracts and processes `signed_attributes` (ASN.1 structure)
   - Verifies signature using signer's public key
   - Mathematical verification: `Verify(PublicKey, Hash(signed_attributes), Signature) == true`

**Reference**: [Signature Validator Documentation](pdf-utils/signature-validator/README.md)

#### Text Extractor (`extractor/`)

**Purpose**: Extracts plain text from PDF files with complex font encoding support.

```rust
pub fn extract_text(pdf_bytes: Vec<u8>) -> Result<Vec<String>, String> {
    let pdf = parse_pdf_structure(&pdf_bytes)?;
    let mut pages_text = Vec::new();

    for page in pdf.pages {
        let content_streams = extract_content_streams(&page)?;
        let text = process_text_operations(&content_streams, &pdf.fonts)?;
        pages_text.push(text);
    }

    Ok(pages_text)
}
```

**Advanced Features**:

- **Font Encoding Support**: ToUnicode maps, Differences arrays, built-in encodings
- **CID Font Handling**: Complex glyph-to-Unicode mapping for Indian government documents
- **Multiple Encodings**: StandardEncoding, WinAnsiEncoding, MacRomanEncoding, PDFDocEncoding
- **Stream Processing**: FlateDecode and other PDF compression methods

**Reference**: [Text Extractor Documentation](pdf-utils/extractor/README.md)

#### Core Library (`core/`)

**Purpose**: Unified interface combining signature validation and text extraction.

```rust
pub fn verify_text(
    pdf_bytes: Vec<u8>,
    page_number: u8,
    substring: &str,
    offset: usize
) -> Result<PdfVerificationResult, String> {
    // Step 1: Verify digital signature
    let signature_result = signature_validator::verify_pdf_signature(&pdf_bytes)?;

    // Step 2: Extract text from all pages
    let pages = extractor::extract_text(pdf_bytes)?;

    // Step 3: Verify substring at specific offset
    let text_matches = verify_substring_at_offset(&pages[page_number as usize], substring, offset);

    Ok(PdfVerificationResult {
        signature: signature_result,
        substring_matches: text_matches,
        pages,
    })
}
```

**Reference**: [Core Library Documentation](pdf-utils/core/README.md)

### 🔐 Zero-Knowledge Circuit Layer (`circuits/`)

#### SP1 Program (`program/src/main.rs`)

**Purpose**: Core zero-knowledge program running inside the SP1 virtual machine.

```rust
#![no_main]
sp1_zkvm::entrypoint!(main);

pub fn main() {
    // Read input from the verifier
    let input = sp1_zkvm::io::read::<PDFCircuitInput>();

    // Perform PDF verification inside ZK environment
    let output = verify_pdf_claim(input).unwrap_or_else(|_| PDFCircuitOutput::failure());

    // Convert to public values and commit
    let public_values: PublicValuesStruct = output.into();
    let bytes = PublicValuesStruct::abi_encode(&public_values);

    // Commit to public values - this becomes part of the proof
    sp1_zkvm::io::commit_slice(&bytes);
}
```

**Key Features**:

- Deterministic execution in constrained environment
- Public value commitment for proof verification
- Error handling with graceful degradation

#### Circuit Library (`lib/`)

**Purpose**: High-level verification functions for circuit implementations.

```rust
pub fn verify_pdf_claim(input: PDFCircuitInput) -> Result<PDFCircuitOutput, String> {
    let PDFCircuitInput {
        pdf_bytes,
        page_number,
        offset,
        substring,
    } = input;

    // Perform verification using core PDF libraries
    let result = verify_text(pdf_bytes, page_number, substring.as_str(), offset as usize)?;

    // Construct circuit output
    Ok(PDFCircuitOutput::from_verification(
        &substring,
        page_number,
        offset,
        result,
    ))
}
```

**Specialized Verification Functions**:

```rust
// GST Certificate specific verification
pub fn verify_gst_certificate(pdf_bytes: Vec<u8>) -> GSTCertificate {
    let verified_content = pdf_core::verify_and_extract(pdf_bytes).unwrap();
    let full_text = verified_content.pages.join(" ");

    // Extract GST number using regex pattern
    let gst_pattern = regex::Regex::new(
        r"([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})"
    ).unwrap();

    let gst_number = gst_pattern
        .captures(&full_text)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap();

    // Extract legal name using regex pattern
    let legal_name_pattern = regex::Regex::new(
        r"Legal Name\s*([A-Za-z\s&.,]+?)(?:\n|Trade Name|Additional|$)"
    ).unwrap();

    let legal_name = legal_name_pattern
        .captures(&full_text)
        .and_then(|cap| cap.get(1))
        .map(|m| m.as_str().trim().to_string())
        .unwrap();

    GSTCertificate {
        gst_number,
        legal_name,
        signature: verified_content.signature,
    }
}
```

**Reference**: [Circuit Library Documentation](circuits/lib/README.md)

#### Smart Contract Integration (`contracts/`)

**Purpose**: On-chain proof verification and attestation on Ethereum.

`PdfVerifier` verifies Groth16 proofs through Succinct's SP1 verifier gateway (`0x397A5f7f3dBd538f23DE225B51f532c34448dA9B`, same address on Ethereum and Sepolia) and records each verified claim as an attestation.

```solidity
struct PublicValuesStruct {
    bool substringMatches;     // requested text is present in the signed PDF
    bytes32 messageDigestHash; // hash of the signed document content
    bytes32 signerKeyHash;     // hash of the issuer's (e.g. DigiLocker) signing key
    bytes32 substringHash;     // hash of the proven text — the text itself stays private
    bytes32 nullifier;         // unique per document + claim, prevents replays
}

contract PdfVerifier {
    function verifyPdfProof(bytes calldata _publicValues, bytes calldata _proofBytes)
        public view returns (PublicValuesStruct memory)
    {
        ISP1Verifier(verifier).verifyProof(programVKey, _publicValues, _proofBytes);
        return abi.decode(_publicValues, (PublicValuesStruct));
    }

    function attest(bytes32 _requestId, bytes calldata _publicValues, bytes calldata _proofBytes)
        external returns (bytes32)
    {
        PublicValuesStruct memory values = verifyPdfProof(_publicValues, _proofBytes);
        if (!values.substringMatches) revert SubstringNotFound();
        if (attestations[values.nullifier].timestamp != 0) revert AlreadyAttested(values.nullifier);

        attestations[values.nullifier] = Attestation({ requestId: _requestId, /* ... */ });
        emit PdfClaimAttested(_requestId, values.nullifier, values.signerKeyHash, /* ... */);
        return values.nullifier;
    }
}
```

| Function | Type | Purpose |
| --- | --- | --- |
| `verifyPdfProof` | view (free) | Verify a proof and return its public values |
| `attest` | transaction | Verify a proof and store it as an attestation for a request |
| `attestations(nullifier)` | view | Read a stored attestation |
| `getRequestNullifiers(requestId)` | view | List every attestation recorded for a request |

**Reference**: [Smart Contract Documentation](circuits/contracts/README.md)

### ⚡ Prover Service Implementation (`circuits/script/`)

#### High-Performance Proof Generation

The proving key is set up once at startup and shared across requests; proving runs on a blocking thread so the server stays responsive.

```rust
async fn prove(
    State(state): State<Arc<AppState>>,
    Json(body): Json<ProofRequest>,
) -> Result<Json<ProveResponse>, ApiError> {
    let mut stdin = SP1Stdin::new();
    stdin.write(&PDFCircuitInput { pdf_bytes, page_number, offset, substring: sub_string });

    // Groth16 proof from the Succinct Prover Network, verifiable on Ethereum
    let proof = tokio::task::spawn_blocking(move || {
        state.client.prove(&state.pk, stdin).groth16().run()
    })
    .await??;

    Ok(Json(ProveResponse {
        public_values: format!("0x{}", hex::encode(proof.public_values.as_slice())),
        proof_bytes: format!("0x{}", hex::encode(proof.bytes())),
        vkey: state.pk.verifying_key().bytes32(),
        proof,
    }))
}
```

#### Proof Verification API

`POST /verify` verifies a proof off-chain with the SP1 SDK. In the app, employers verify on-chain through `PdfVerifier` instead (see [On-Chain Proof Verification](#-snark-proof-verification)).

#### Network Prover Configuration

```bash
# High-performance network prover
SP1_PROVER=network \
NETWORK_PRIVATE_KEY=<SUCCINCT_API_KEY> \
RUST_LOG=info \
cargo run --release --bin prover

# Local prover (development)
RUST_LOG=info \
cargo run --release --bin prover
```

---

## Frontend Implementation Guide

### 🎨 Next.js 15 Application Architecture

The frontend is built using the **App Router** architecture with server-side components and client-side interactivity.

#### Project Structure

```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── name/[id]/         # Name verification workflow
│   │   ├── academic/[id]/     # Academic verification workflow
│   │   ├── pan/[id]/          # PAN verification workflow
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable UI components
│   │   ├── Header.tsx         # Navigation header
│   │   └── ui/               # Shadcn/ui components
│   ├── actions/              # Server actions
│   │   ├── nameActions.ts    # Name verification logic
│   │   ├── academicActions.ts # Academic verification logic
│   │   └── panActions.ts     # PAN verification logic
│   ├── models/               # MongoDB schemas
│   ├── utils/                # Utility functions
│   │   ├── mail/            # Email service
│   │   └── connectToDb.ts   # Database connection
│   └── pkg/                 # WebAssembly modules
```

### 🔄 Email-Based Verification Workflow

#### 1. Verification Request System

**Request Creation Flow**:

```typescript
export async function createNameVerify(
  name: string,
  email: string,
  recieverEmail: string
) {
  await connectToDB();

  // Create verification record
  const nameVerify = new NameVerify({
    proverName: name,
    email,
    recieverEmail,
    isVerified: false,
  });

  await nameVerify.save();

  // Send email with verification link
  await sendNameVerificationEmail(recieverEmail, email, name, nameVerify._id);

  return { success: true, message: "Verification request sent" };
}
```

**Database Schema** (`models/nameModel.ts`):

```typescript
const NameSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    recieverEmail: { type: String, required: true },
    proverName: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    snark: { type: mongoose.Schema.Types.Mixed }, // SNARK proof data
    signature: { type: String }, // Public key from PDF
  },
  { timestamps: true }
);
```

#### 2. Email Template System

**Professional Email Templates** (`utils/mail/nameMail.ts`):

```typescript
export const sendNameVerificationEmail = async (
  to: string,
  fromEmail: string,
  proverName: string,
  id: string
) => {
  const verifyUrl = `${process.env.API_URL}/name/${id}`;

  const mailOptions = {
    from: `"Wisk" <wisk.zk.dev@gmail.com>`,
    to,
    subject: `Verify Name Request - Wisk`,
    html: `
      <div style="
        font-family: Arial, sans-serif;
        background-color: #ffffff;
        color: #000000;
        padding: 32px;
        max-width: 600px;
        margin: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
      ">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
          Name Verification Request
        </h2>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
          You received a verification request from <strong>${fromEmail}</strong> 
          to verify the name <strong>${proverName}</strong>.
        </p>
        <a href="${verifyUrl}" 
          style="
            display: inline-block;
            text-decoration: none;
            background-color: #000;
            color: #fff;
            font-size: 14px;
            padding: 12px 20px;
            border-radius: 6px;
            font-weight: 500;
          ">
          Verify Name
        </a>
        <p style="font-size: 12px; color: #444; margin-top: 24px;">
          If you did not expect this request, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
```

### 🌐 WebAssembly Integration

#### WASM Module Loading

```typescript
// Dynamic WASM loading with error handling
const loadWasm = async () => {
  try {
    const wasm = await import("@/pkg/pdf_utils_wasm");
    await wasm.default(); // Initialize WASM module
    return wasm;
  } catch (error) {
    console.error("Failed to load WASM module:", error);
    throw new Error("WebAssembly module failed to load");
  }
};
```

#### Client-Side PDF Processing

```typescript
const processFile = useCallback(
  async (file: File) => {
    setStatus("Processing PDF file...");
    setProcessing(true);

    try {
      // Convert file to Uint8Array
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      setPdfBytes(uint8);

      // Load and use WebAssembly module
      const wasm = await loadWasm();
      const result = wasm.wasm_verify_and_extract(uint8);

      if (result?.success) {
        // Update verification states
        setPublicKeyPEM(result.signature.public_key);
        setSignatureValid(result.signature.is_valid);
        setPages(result.pages);

        // Verify required text is present
        const textPresent = verifyTextInPages(result.pages, res.proverName);
        setTextVerified(textPresent);

        setStatus(
          textPresent
            ? "✅ PDF verified and text found"
            : "⚠️ Required text not found in PDF"
        );
      } else {
        throw new Error(result?.error || "PDF processing failed");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setStatus("❌ PDF processing failed");
      toast.error("Error processing PDF file");
    } finally {
      setProcessing(false);
    }
  },
  [res?.proverName, verifyTextInPages]
);
```

### 🎯 Multi-Field Document Verification

#### Academic Verification Implementation

The academic verification system handles multiple fields concurrently:

```typescript
const onGenerateProof = async () => {
  // Validation checks
  const checks = {
    "PDF signature must be valid": signatureValid,
    "Name must be present in PDF": nameVerified,
    "Academic ID must be present in PDF": academicIdVerified,
    "CGPA must be present in PDF": cgpaVerified,
    "Institute must be present in PDF": instituteVerified,
  };

  for (const [msg, condition] of Object.entries(checks)) {
    if (!condition) return toast.error(msg);
  }

  setProcessing(true);
  setStatus("Generating SNARK proofs...");

  try {
    const proveEndpoint = `${PROVER_URL}/prove`; // NEXT_PUBLIC_PROVER_URL

    // Generate proofs for all fields in parallel
    const makeProofRequest = (sub_string: string) =>
      fetch(proveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf_bytes: Array.from(pdfBytes!),
          page_number: 1,
          offset: 0,
          sub_string,
        }),
      });

    const [
      nameProofResponse,
      academicIdProofResponse,
      instituteProofResponse,
      cgpaProofResponse,
    ] = await Promise.all([
      makeProofRequest(res.proverName),
      makeProofRequest(res.proverAcademicId),
      makeProofRequest(res.proverInstitute),
      makeProofRequest(res.proverCGPA),
    ]);

    // Combine all proofs
    const combinedProof = {
      nameProof: await nameProofResponse.json(),
      academicIdProof: await academicIdProofResponse.json(),
      instituteProof: await instituteProofResponse.json(),
      cgpaProof: await cgpaProofResponse.json(),
    };

    setProofData(JSON.stringify(combinedProof, null, 2));
    setProofGenerated(true);
    toast.success("All SNARK proofs generated successfully!");
  } catch (error) {
    toast.error("Error generating proofs: " + error.message);
  } finally {
    setProcessing(false);
  }
};
```

#### Advanced Text Verification Logic

```typescript
const verifyTextInPages = useCallback(
  (extractedPages: string[], searchText: string): boolean => {
    const normalizeText = (text: string) =>
      text.toLowerCase().replace(/\s+/g, " ").trim();

    const normalizedSearchText = normalizeText(searchText);

    return extractedPages.some((page) => {
      const normalizedPage = normalizeText(page);
      return normalizedPage.includes(normalizedSearchText);
    });
  },
  []
);

// Specialized verification for different document types
const verifyCgpaInPages = useCallback(
  (extractedPages: string[], proverCgpa: string): boolean => {
    const cgpaVariations = [
      proverCgpa,
      proverCgpa.replace(".", ""),
      `CGPA: ${proverCgpa}`,
      `CGPA ${proverCgpa}`,
    ];

    return extractedPages.some((page) =>
      cgpaVariations.some((variation) =>
        normalizeText(page).includes(variation.toLowerCase())
      )
    );
  },
  []
);
```

### 🎨 UI/UX Implementation

#### Real-Time Verification Status

```typescript
const VerificationResultItem = ({
  label,
  isValid,
  validText = "Valid",
  invalidText = "Invalid",
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
    <span className="text-sm font-medium">{label}</span>
    <Badge
      variant={isValid ? "default" : "destructive"}
      className="shadow-sm px-3 py-1"
    >
      {isValid ? validText : invalidText}
    </Badge>
  </div>
);

// Usage in verification workflow
{
  signatureValid !== null && (
    <VerificationResultItem
      label="Digital Signature"
      isValid={signatureValid}
      validText="Valid"
      invalidText="Invalid"
    />
  );
}
{
  nameVerified !== null && (
    <VerificationResultItem label="Name Verification" isValid={nameVerified} />
  );
}
```

#### Progressive Loading States

```typescript
const ProcessingIndicator = ({ processing, status }) => (
  <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
    {processing ? (
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/20 border-t-primary"></div>
    ) : (
      <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
    )}
    <span className="text-muted-foreground text-sm font-medium">{status}</span>
  </div>
);
```

#### Responsive File Upload Component

```typescript
const FileUploadZone = ({ onFileSelect, processing, accept = ".pdf" }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400"
        }
        ${processing ? "pointer-events-none opacity-50" : "cursor-pointer"}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => onFileSelect(e.target.files?.[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={processing}
      />
      <div className="space-y-4">
        <div className="h-16 w-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-lg font-semibold">Drop your PDF here</p>
          <p className="text-muted-foreground">or click to browse</p>
        </div>
      </div>
    </div>
  );
};
```

### 🔐 SNARK Proof Verification

#### On-Chain Proof Verification

When the candidate submits, a server action records every proof on Ethereum (`attest`) and stores the transaction hashes with the request. When the employer opens the request, each proof is re-verified against the `PdfVerifier` contract with a free `eth_call`, and the page links to the attestation transactions on Etherscan.

```typescript
// app/src/actions/chainActions.ts
export async function verifySnarkOnChain(snark: any) {
  const proofs = Object.entries(collectProofs(snark)); // nameProof, panProof, ...
  const results = await Promise.all(
    proofs.map(async ([field, proof]) => {
      const values = await publicClient.readContract({
        address: PDF_VERIFIER_ADDRESS,
        abi: pdfVerifierAbi,
        functionName: "verifyPdfProof",
        args: [proof.publicValues, proof.proofBytes],
      });
      return { field, valid: values.substringMatches, nullifier: values.nullifier };
    })
  );
  return { valid: results.every((r) => r.valid), results };
}

// Called when the candidate sends their proof
export async function attestSnark(requestId: string, snark: any) {
  const hashes: string[] = [];
  for (const proof of Object.values(collectProofs(snark))) {
    hashes.push(await attestOnChain(requestId, proof)); // PdfVerifier.attest(...)
  }
  return hashes;
}
```

---

## Developer Documentation

### 🚀 Quick Start Guide

#### Prerequisites

Before setting up WISK, ensure you have:

- **[Rust](https://rustup.rs/)** (latest stable)
- **[Node.js](https://nodejs.org/)** (v18 or later)
- **[SP1 Toolkit](https://docs.succinct.xyz/docs/sp1/getting-started/install)**
- **[MongoDB](https://www.mongodb.com/try/download/community)** (local or cloud)

#### Installation Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/YadlaMani/wisk.git
   cd wisk
   ```

2. **Build PDF Utilities**

   ```bash
   cd pdf-utils/wasm
   wasm-pack build --target web
   cd ../..
   ```

3. **Build ZK Circuits**

   ```bash
   cd circuits
   cargo build --release
   sp1 build
   cd ..
   ```

4. **Install Frontend Dependencies**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

#### Development Workflow

**Terminal 1 - Prover Service**:

```bash
cd circuits/script
SP1_PROVER=network \
NETWORK_PRIVATE_KEY=your_succinct_key \
RUST_LOG=info \
cargo run --release --bin prover
```

**Terminal 2 - Frontend Development**:

```bash
cd frontend
npm run dev
```

**Terminal 3 - MongoDB (if local)**:

```bash
mongod --dbpath /usr/local/var/mongodb
```

### 🧪 Testing Framework

#### Unit Tests for PDF Processing

```bash
# Run signature validator tests
cd pdf-utils/signature-validator
cargo test

# Run text extractor tests
cd ../extractor
cargo test

# Run core library tests
cd ../core
cargo test
```

#### Integration Tests for Circuits

```bash
# Test circuit compilation
cd circuits
cargo test

# Test proof generation
cd script
cargo test test_proof_generation
```

#### Frontend Testing

```bash
# Run component tests
cd frontend
npm test

# Run E2E tests
npm run test:e2e
```

### 📊 Performance Benchmarks

#### Proof Generation Times

| Document Type       | Local Prover | Network Prover | Memory Usage |
| ------------------- | ------------ | -------------- | ------------ |
| Single Name         | 45-90s       | 15-25s         | ~2.1GB       |
| PAN + Name          | 60-120s      | 20-35s         | ~2.8GB       |
| Academic (4 fields) | 90-180s      | 30-60s         | ~3.5GB       |
| GST Certificate     | 50-100s      | 18-30s         | ~2.3GB       |

#### Browser Performance

| Operation        | Chrome | Firefox | Safari | Memory |
| ---------------- | ------ | ------- | ------ | ------ |
| PDF Parse        | ~200ms | ~250ms  | ~300ms | ~15MB  |
| WASM Load        | ~100ms | ~150ms  | ~200ms | ~8MB   |
| Signature Verify | ~50ms  | ~75ms   | ~100ms | ~5MB   |
| Text Extract     | ~150ms | ~200ms  | ~250ms | ~12MB  |

---

## Setup & Deployment

### 🏗️ Local Development Setup

#### Environment Variables

Create `.env.local` in the frontend directory:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/wisk
DATABASE_URL=mongodb://localhost:27017/wisk

# Email Configuration (for verification emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API Configuration
API_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Clerk Authentication (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Prover service URL
NEXT_PUBLIC_PROVER_URL=http://localhost:3001

# Ethereum
ETH_CHAIN=sepolia                       # or 'mainnet'
ETH_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io
PDF_VERIFIER_ADDRESS=0x...              # deployed PdfVerifier
RELAYER_PRIVATE_KEY=0x...               # wallet that submits attestations

# SP1 Configuration (for prover service)
SP1_PROVER=network
NETWORK_PRIVATE_KEY=your_succinct_network_key
RUST_LOG=info
```

#### Build Commands

```bash
# Build everything
make build-all

# Or step by step:
make build-pdf-utils
make build-circuits
make build-frontend
```

### ⛓️ Ethereum Deployment

| Network | Contract | Address |
| --- | --- | --- |
| Sepolia | `PdfVerifier` | `<PDF_VERIFIER_ADDRESS>` |
| Sepolia / Ethereum | SP1 Verifier Gateway (Groth16) | `0x397A5f7f3dBd538f23DE225B51f532c34448dA9B` |

Program verification key (SP1 v6): `0x0053195ac71360b9b760f63d1a2f659d28cf381c39598c42d79e17ef8b6ea224`

```bash
# 1. Print the program verification key
cd circuits/script && cargo run --release --bin vkey

# 2. Run the contract tests
cd ../contracts && forge test

# 3. Deploy PdfVerifier
PROGRAM_VKEY=0x0053195ac71360b9b760f63d1a2f659d28cf381c39598c42d79e17ef8b6ea224 \
forge script script/DeployPdfVerifier.s.sol \
  --rpc-url $ETH_RPC_URL --private-key $RELAYER_PRIVATE_KEY --broadcast

# 4. Set PDF_VERIFIER_ADDRESS in app/.env to the deployed address
```

### 🚢 Production Deployment

#### Docker Deployment

```dockerfile
# Dockerfile for prover service
FROM rust:1.75 as builder

WORKDIR /app
COPY circuits/ ./circuits/
COPY pdf-utils/ ./pdf-utils/

RUN cd circuits && cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/circuits/target/release/prover /usr/local/bin/
EXPOSE 3001
CMD ["prover"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  prover:
    build: .
    ports:
      - "3001:3001"
    environment:
      - SP1_PROVER=network
      - NETWORK_PRIVATE_KEY=${SUCCINCT_API_KEY}
      - RUST_LOG=info

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - API_URL=http://localhost:3000
    depends_on:
      - mongodb

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

#### Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

#### Railway/Render Deployment (Prover Service)

```bash
# railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "prover",
    "healthcheckPath": "/health"
  }
}
```

---

## API Reference

### 🔌 Prover Service API

**Base URL**: `http://localhost:3001`

#### Generate Proof

```http
POST /prove
Content-Type: application/json

{
  "pdf_bytes": [/* array of bytes */],
  "page_number": 1,
  "offset": 0,
  "sub_string": "John Doe"
}
```

**Response**:

```json
{
  "proof": { "Groth16": { "...": "..." } },
  "public_values": { "buffer": { "data": [] } },
  "sp1_version": "v6.x",
  "publicValues": "0x...",
  "proofBytes": "0x...",
  "vkey": "0x0053195a..."
}
```

`publicValues` and `proofBytes` are passed directly to `PdfVerifier.verifyPdfProof` / `attest`.

#### Verify Proof

```http
POST /verify
Content-Type: application/json

{
  "proof": "0x...",
  "public_values": "0x...",
  "vkey": "0x..."
}
```

**Response**:

```json
{
  "valid": true,
  "error": null
}
```

### 🌐 Frontend API Routes

#### Verification Actions

```typescript
// Name verification
POST /api/name/create
{
  "name": "John Doe",
  "email": "requester@example.com",
  "receiverEmail": "john@example.com"
}

// Academic verification
POST /api/academic/create
{
  "proverName": "John Doe",
  "proverAcademicId": "12345",
  "proverInstitute": "MIT",
  "proverCGPA": "9.5",
  "email": "requester@example.com",
  "receiverEmail": "john@example.com"
}

// PAN verification
POST /api/pan/create
{
  "proverName": "John Doe",
  "proverPanId": "ABCDE1234F",
  "email": "requester@example.com",
  "receiverEmail": "john@example.com"
}
```

### 📱 WebAssembly API

```typescript
// Load WASM module
const wasm = await import("@/pkg/pdf_utils_wasm");
await wasm.default();

// Verify and extract PDF
const result = wasm.wasm_verify_and_extract(pdfBytes);

// Verify signature only
const sigResult = wasm.wasm_verify_signature(pdfBytes);

// Extract text only
const textResult = wasm.wasm_extract_text(pdfBytes);

// Verify specific text
const verifyResult = wasm.wasm_verify_text(
  pdfBytes,
  pageNumber,
  substring,
  offset
);
```

---

## Security & Privacy

### 🛡️ Security Architecture

#### Cryptographic Security

1. **Zero-Knowledge Properties**

   - **Completeness**: Valid documents always generate valid proofs
   - **Soundness**: Invalid documents cannot generate valid proofs
   - **Zero-Knowledge**: Proofs reveal no information beyond the verified claim

2. **Digital Signature Validation**

   - PKCS#7/CMS standard compliance
   - RSA signature verification with SHA-256/SHA-1/SHA-384/SHA-512
   - Certificate chain validation against government root CAs
   - Tamper detection through ByteRange integrity checks

3. **Content Integrity Assurance**
   - Cryptographic hashing of signed content
   - Byte-level comparison with embedded message digests
   - Detection of any document modifications post-signing

#### Privacy Protection

1. **Local Processing Model**

   - PDF parsing and text extraction in WebAssembly
   - Private key operations never leave user's device
   - Zero server-side storage of document content

2. **Minimal Data Exposure**

   - Proof contains only the verified claim (e.g., "name matches")
   - Original document content remains private
   - Metadata and other document details are not disclosed

3. **Trustless Architecture**
   - Cryptographic proofs are mathematically verifiable
   - Open-source codebase allows independent auditing
   - Decentralized verification through standard SNARK protocols

#### Operational Security

1. **Input Validation**

   - PDF structure validation before processing
   - Content-type verification for uploaded files
   - Size limits to prevent resource exhaustion
   - Sanitization of all user inputs

2. **Error Handling**
   - No sensitive information in error messages
   - Graceful degradation on verification failures
   - Rate limiting on proof generation endpoints
   - Comprehensive logging for security monitoring

### 🔒 Security Best Practices

#### For Developers

```rust
// Always validate inputs
pub fn verify_pdf_signature(pdf_bytes: &[u8]) -> Result<PdfSignatureResult, String> {
    if pdf_bytes.is_empty() {
        return Err("PDF bytes cannot be empty".to_string());
    }

    if pdf_bytes.len() > MAX_PDF_SIZE {
        return Err("PDF file too large".to_string());
    }

    // Continue with validation...
}
```

#### For Deployments

```bash
# Use strong environment variables
export SP1_PROVER=network
export NETWORK_PRIVATE_KEY=$(cat /run/secrets/succinct_key)
export MONGODB_URI=$(cat /run/secrets/mongodb_uri)

# Enable HTTPS only
export FORCE_HTTPS=true
export HSTS_MAX_AGE=31536000

# Configure rate limiting
export RATE_LIMIT_REQUESTS=100
export RATE_LIMIT_WINDOW=3600
```

---

## Resources & Links

### 📚 Technical Documentation

- **[SP1 Documentation](https://docs.succinct.xyz/)** - Zero-knowledge virtual machine
- **[WebAssembly Guide](https://rustwasm.github.io/docs/book/)** - Rust to WASM compilation
- **[Next.js App Router](https://nextjs.org/docs/app)** - Modern React framework
- **[PDF Reference](https://www.adobe.com/devnet/pdf/pdf_reference.html)** - Official PDF specification
- **[PKCS#7 Standard](https://tools.ietf.org/html/rfc5652)** - Cryptographic message syntax

### 🛠️ Development Tools

- **[Rust Analyzer](https://rust-analyzer.github.io/)** - IDE support for Rust
- **[wasm-pack](https://rustwasm.github.io/wasm-pack/)** - Rust to WebAssembly toolchain
- **[Foundry](https://book.getfoundry.sh/)** - Smart contract development toolkit
- **[Thunder Client](https://www.thunderclient.com/)** - API testing for VS Code

### 🔗 Cryptography Resources

- **[Zero-Knowledge Proofs](https://z.cash/technology/zksnarks/)** - Introduction to zk-SNARKs
- **[Digital Signatures](https://en.wikipedia.org/wiki/Digital_signature)** - Cryptographic signatures
- **[PKI Fundamentals](https://www.ssl.com/faqs/what-is-pki/)** - Public key infrastructure
- **[ASN.1 Notation](https://www.itu.int/rec/T-REC-X.690/)** - Abstract syntax notation

### 🌐 Government Integration

- **[DigiLocker](https://digilocker.gov.in/)** - Government document repository
- **[e-Sign Framework](https://cca.gov.in/esign/)** - Digital signature standards
- **[Aadhaar API](https://uidai.gov.in/ecosystem/authentication-devices-documents/developer-section)** - Identity verification

### 📖 Academic Papers

- **[zk-SNARKs](https://eprint.iacr.org/2013/879.pdf)** - Succinct Non-Interactive Arguments
- **[Bulletproofs](https://eprint.iacr.org/2017/1066.pdf)** - Short Proofs for Confidential Transactions
- **[PLONK](https://eprint.iacr.org/2019/953.pdf)** - Permutations over Lagrange-bases

### 💬 Community & Support

- **[GitHub Issues](https://github.com/YadlaMani/wisk/issues)** - Bug reports and feature requests
- **[Discussions](https://github.com/YadlaMani/wisk/discussions)** - Community discussions
- **[Discord](https://discord.gg/wisk)** - Real-time chat and support
- **[Twitter](https://twitter.com/wisk_zk)** - Updates and announcements

---

## Contributing

We welcome contributions to WISK! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Pull request process
- Testing requirements
- Documentation standards

### 🤝 How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

_Built with ❤️ by the WISK team. Transforming document verification through zero-knowledge cryptography._
