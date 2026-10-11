use sp1_sdk::{
    blocking::{Prover, ProverClient},
    include_elf, Elf, HashableKey, ProvingKey,
};

/// The ELF (executable and linkable format) file for the Succinct RISC-V zkVM.
pub const ZKPDF_ELF: Elf = include_elf!("zkpdf-program");

fn main() {
    let prover = ProverClient::builder().cpu().build();
    let pk = prover.setup(ZKPDF_ELF).expect("failed to setup elf");
    println!("{}", pk.verifying_key().bytes32());
}
