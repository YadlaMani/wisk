// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

/// @notice Public values committed by the zkPDF program.
struct PublicValuesStruct {
    bool substringMatches;
    bytes32 messageDigestHash;
    bytes32 signerKeyHash;
    bytes32 substringHash;
    bytes32 nullifier;
}

/// @notice A claim about a signed PDF that has been proven and recorded on-chain.
struct Attestation {
    bytes32 requestId;
    bytes32 signerKeyHash;
    bytes32 substringHash;
    bytes32 messageDigestHash;
    address submitter;
    uint64 timestamp;
}

/// @title PdfVerifier
/// @notice Verifies SP1 proofs for the zkPDF program and records verified claims as attestations.
contract PdfVerifier {
    /// @notice Address of the on-chain SP1 verifier contract.
    address public verifier;

    /// @notice Verification key for the zkPDF program.
    bytes32 public programVKey;

    /// @notice Attestations keyed by the proof nullifier.
    mapping(bytes32 => Attestation) public attestations;

    /// @notice Nullifiers recorded for each verification request.
    mapping(bytes32 => bytes32[]) internal requestNullifiers;

    event PdfClaimAttested(
        bytes32 indexed requestId,
        bytes32 indexed nullifier,
        bytes32 indexed signerKeyHash,
        bytes32 substringHash,
        bytes32 messageDigestHash,
        address submitter
    );

    error SubstringNotFound();
    error AlreadyAttested(bytes32 nullifier);

    constructor(address _verifier, bytes32 _programVKey) {
        verifier = _verifier;
        programVKey = _programVKey;
    }

    /// @notice Verifies a zkPDF proof and returns the decoded public values.
    /// @param _publicValues ABI-encoded public values emitted by the zkPDF program.
    /// @param _proofBytes Encoded SP1 proof bytes.
    function verifyPdfProof(
        bytes calldata _publicValues,
        bytes calldata _proofBytes
    ) public view returns (PublicValuesStruct memory) {
        ISP1Verifier(verifier).verifyProof(programVKey, _publicValues, _proofBytes);
        return abi.decode(_publicValues, (PublicValuesStruct));
    }

    /// @notice Verifies a zkPDF proof and records it as an attestation for a verification request.
    /// @param _requestId Identifier of the verification request this proof answers.
    /// @param _publicValues ABI-encoded public values emitted by the zkPDF program.
    /// @param _proofBytes Encoded SP1 proof bytes.
    function attest(
        bytes32 _requestId,
        bytes calldata _publicValues,
        bytes calldata _proofBytes
    ) external returns (bytes32) {
        PublicValuesStruct memory values = verifyPdfProof(_publicValues, _proofBytes);
        if (!values.substringMatches) revert SubstringNotFound();
        if (attestations[values.nullifier].timestamp != 0) revert AlreadyAttested(values.nullifier);

        attestations[values.nullifier] = Attestation({
            requestId: _requestId,
            signerKeyHash: values.signerKeyHash,
            substringHash: values.substringHash,
            messageDigestHash: values.messageDigestHash,
            submitter: msg.sender,
            timestamp: uint64(block.timestamp)
        });
        requestNullifiers[_requestId].push(values.nullifier);

        emit PdfClaimAttested(
            _requestId,
            values.nullifier,
            values.signerKeyHash,
            values.substringHash,
            values.messageDigestHash,
            msg.sender
        );
        return values.nullifier;
    }

    /// @notice Returns the nullifiers of all attestations recorded for a verification request.
    function getRequestNullifiers(bytes32 _requestId) external view returns (bytes32[] memory) {
        return requestNullifiers[_requestId];
    }
}
