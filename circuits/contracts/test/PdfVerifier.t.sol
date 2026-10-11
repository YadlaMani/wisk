// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {PdfVerifier, PublicValuesStruct} from "../src/PdfVerifier.sol";
import {SP1VerifierGateway} from "@sp1-contracts/SP1VerifierGateway.sol";

/// @dev Fields are in alphabetical order, as `parseRaw` returns JSON keys sorted.
struct SP1ProofFixtureJson {
    bytes32 messageDigestHash;
    bytes32 nullifier;
    bytes proof;
    bytes publicValues;
    bytes32 signerKeyHash;
    bytes32 substringHash;
    bool substringMatches;
    bytes32 vkey;
}

contract PdfVerifierGroth16Test is Test {
    using stdJson for string;

    address verifier;
    PdfVerifier public pdfVerifier;

    function loadFixture() public view returns (SP1ProofFixtureJson memory) {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/src/fixtures/groth16-fixture.json");
        string memory json = vm.readFile(path);
        bytes memory jsonBytes = json.parseRaw(".");
        return abi.decode(jsonBytes, (SP1ProofFixtureJson));
    }

    function setUp() public {
        SP1ProofFixtureJson memory fixture = loadFixture();

        verifier = address(new SP1VerifierGateway(address(1)));
        pdfVerifier = new PdfVerifier(verifier, fixture.vkey);
    }

    function test_ValidPdfProof() public {
        SP1ProofFixtureJson memory fixture = loadFixture();

        vm.mockCall(verifier, abi.encodeWithSelector(SP1VerifierGateway.verifyProof.selector), abi.encode(true));

        PublicValuesStruct memory expected = abi.decode(fixture.publicValues, (PublicValuesStruct));
        PublicValuesStruct memory publicValues = pdfVerifier.verifyPdfProof(fixture.publicValues, fixture.proof);
        assertTrue(publicValues.substringMatches == fixture.substringMatches);
        assertEq(publicValues.messageDigestHash, expected.messageDigestHash);
        assertEq(publicValues.signerKeyHash, expected.signerKeyHash);
        assertEq(publicValues.substringHash, expected.substringHash);
        assertEq(publicValues.nullifier, expected.nullifier);
    }

    function testRevert_InvalidPdfProof() public {
        vm.expectRevert();

        SP1ProofFixtureJson memory fixture = loadFixture();

        bytes memory fakeProof = new bytes(fixture.proof.length);

        pdfVerifier.verifyPdfProof(fixture.publicValues, fakeProof);
    }
}

contract PdfVerifierAttestTest is Test {
    using stdJson for string;

    address verifier;
    PdfVerifier public pdfVerifier;
    SP1ProofFixtureJson fixture;
    bytes32 constant REQUEST_ID = keccak256("request-1");

    function setUp() public {
        string memory json = vm.readFile(string.concat(vm.projectRoot(), "/src/fixtures/groth16-fixture.json"));
        fixture = abi.decode(json.parseRaw("."), (SP1ProofFixtureJson));
        verifier = address(new SP1VerifierGateway(address(1)));
        pdfVerifier = new PdfVerifier(verifier, fixture.vkey);
        vm.mockCall(verifier, abi.encodeWithSelector(SP1VerifierGateway.verifyProof.selector), abi.encode(true));
    }

    function test_AttestRecordsClaim() public {
        PublicValuesStruct memory expected = abi.decode(fixture.publicValues, (PublicValuesStruct));

        bytes32 nullifier = pdfVerifier.attest(REQUEST_ID, fixture.publicValues, fixture.proof);

        assertEq(nullifier, expected.nullifier);
        (bytes32 requestId, bytes32 signerKeyHash, bytes32 substringHash,, address submitter, uint64 timestamp) =
            pdfVerifier.attestations(nullifier);
        assertEq(requestId, REQUEST_ID);
        assertEq(signerKeyHash, expected.signerKeyHash);
        assertEq(substringHash, expected.substringHash);
        assertEq(submitter, address(this));
        assertGt(timestamp, 0);
        assertEq(pdfVerifier.getRequestNullifiers(REQUEST_ID).length, 1);
    }

    function testRevert_AttestTwice() public {
        pdfVerifier.attest(REQUEST_ID, fixture.publicValues, fixture.proof);
        PublicValuesStruct memory expected = abi.decode(fixture.publicValues, (PublicValuesStruct));
        vm.expectRevert(abi.encodeWithSelector(PdfVerifier.AlreadyAttested.selector, expected.nullifier));
        pdfVerifier.attest(REQUEST_ID, fixture.publicValues, fixture.proof);
    }

    function testRevert_AttestWhenSubstringMissing() public {
        PublicValuesStruct memory values = abi.decode(fixture.publicValues, (PublicValuesStruct));
        values.substringMatches = false;
        vm.expectRevert(PdfVerifier.SubstringNotFound.selector);
        pdfVerifier.attest(REQUEST_ID, abi.encode(values), fixture.proof);
    }
}
