// processor.rs
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program_error::ProgramError,
    msg,
    pubkey::Pubkey,
    program_pack::{Pack, IsInitialized},
    sysvar::{rent::Rent, Sysvar},
    program::invoke
};

use crate::{instruction::OrcaSwapInstruction, error::OrcaSwapError};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8]
    ) -> ProgramResult {
            let instruction = OrcaSwapInstruction::unpack(instruction_data)?;

            match instruction {
                OrcaSwapInstruction::InitOrcaSwap { input_amount, minimum_output_amount } => {
                    msg!("Instruction: InitOrcaSwap");
                    Self::process_init_orca_swap(accounts, input_amount, minimum_output_amount, program_id)
                }
            }
    }

    fn process_init_orca_swap(
        accounts: &[AccountInfo],
        input_amount: u64,
        minimum_output_amount: u64,
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter);

        Ok(())
    }
}