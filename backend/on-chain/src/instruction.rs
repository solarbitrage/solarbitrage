// instruction.rs
// Attempts to decode the instructions given to the program

use std::convert::TryInto;
use solana_program::program_error::ProgramError;
use crate::error::OrcaSwapError::InvalidInstruction;

use solana_program::{
    msg,
};

pub enum OrcaSwapInstruction {
    // Starts the trade
    ///
    ///
    /// Accounts expected:
    /// 
    /// 0. '[]' The address of the token pool
    /// 1. '[]' The authority for the pool address
    /// 2. '[]' The user transfer authority address generated by the approval instruction
    /// 3. '[]' The user token account of token A
    /// 4. '[]' The pool token account of token A
    /// 5. '[]' The pool token account of token B
    /// 6. '[]' The user token account of token B
    /// 7. '[]' The mint address of the token pool
    /// 8. '[]' The fee account address
    /// 9. '[]' The tokan swap smart contract address
    
    InitOrcaSwap {
        input_amount: u64,
        minimum_output_amount: u64,
    }
}

impl OrcaSwapInstruction {
    // Unpacks a byte buffer into a [OrcaSwapInstruction](enum.OrcaSwapInstruction)
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;
        msg!("{:?}", tag);
        Ok(match tag {
            0 => Self::InitOrcaSwap {
                input_amount: 0,
                minimum_output_amount: 0,
            },
            _ => return Err(InvalidInstruction.into()),
        })
        /*Ok(
            Self::InitOrcaSwap {
                input_amount: Self::unpack_input_amount(rest)?
                minimum_output_amount: Self::unpack_input_amount()
            }
        })*/
    }
}