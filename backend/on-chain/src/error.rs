// error.rs
use thiserror::Error;
use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum OrcaSwapError {
    /// Invalid Instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
    /// Not Rent Exempt
    #[error("Not Rent Exempt")]
    NotRentExempt,
}

impl From<OrcaSwapError> for ProgramError {
    fn from(e: OrcaSwapError) -> Self {
        ProgramError::Custom(e as u32)
    }
}