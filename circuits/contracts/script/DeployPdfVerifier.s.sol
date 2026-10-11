// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PdfVerifier} from "../src/PdfVerifier.sol";

/// @notice Deploys PdfVerifier pointing at Succinct's SP1 Groth16 verifier gateway.
/// Usage:
///   PROGRAM_VKEY=0x... forge script script/DeployPdfVerifier.s.sol \
///     --rpc-url $RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast
contract DeployPdfVerifier is Script {
    /// @dev Same address on Ethereum, Sepolia, Base and other supported chains.
    address constant SP1_VERIFIER_GATEWAY_GROTH16 = 0x397A5f7f3dBd538f23DE225B51f532c34448dA9B;

    function run() external returns (PdfVerifier pdfVerifier) {
        bytes32 programVKey = vm.envBytes32("PROGRAM_VKEY");
        address gateway = vm.envOr("SP1_VERIFIER_GATEWAY", SP1_VERIFIER_GATEWAY_GROTH16);

        vm.startBroadcast();
        pdfVerifier = new PdfVerifier(gateway, programVKey);
        vm.stopBroadcast();

        console.log("PdfVerifier deployed at", address(pdfVerifier));
        console.log("Program vkey");
        console.logBytes32(programVKey);
    }
}
