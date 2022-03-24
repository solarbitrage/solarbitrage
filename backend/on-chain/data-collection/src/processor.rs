// processor.rs
use borsh::{BorshDeserialize, BorshSerialize};

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

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    pub counter: u32,
}

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        _instruction_data: &[u8]
    ) -> ProgramResult {
        msg!("Initialized the processor module of Solarbitrage!");

        let accounts_iter = &mut accounts.iter();

        let account = next_account_info(accounts_iter)?;

        if account.owner != program_id {
            msg!("Greeted account does not have the correct program id");
            return Err(ProgramError::IncorrectProgramId);
        }
    
        let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
        greeting_account.counter += 1;
        greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;
    
        msg!("Greeted {} time(s)!", greeting_account.counter);
    
        Ok(())
    }
}