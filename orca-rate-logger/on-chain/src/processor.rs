//! Program state processor

use std::str::from_utf8;
use solana_program::{
    account_info::{next_account_info, AccountInfo}, entrypoint::ProgramResult, msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
use spl_token::{
    solana_program::{
        program_pack::Pack,
    },
    state::Account
};

/// Instruction processor
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let input_pool_token = next_account_info(account_info_iter)?;
    let output_pool_token = next_account_info(account_info_iter)?;

    let input_pool_data = input_pool_token.try_borrow_data()?;
    let input_acc = Account::unpack_from_slice(&input_pool_data);

    let output_pool_data = output_pool_token.data.borrow();
    let output_acc = Account::unpack_from_slice(&output_pool_data);

    if input_acc.is_err() || output_acc.is_err() {
        return Err(ProgramError::InvalidAccountData);
    }

    let input_acc_amt = input_acc.unwrap().amount;
    let output_acc_amt = output_acc.unwrap().amount;

    let memo = from_utf8(input).map_err(|err| {
        msg!("Invalid UTF-8, from byte {}", err.valid_up_to());
        ProgramError::InvalidInstructionData
    })?;
    msg!("MSG: {:?}", memo);
    msg!("INPUT_ACC_AMT: {:?}", input_acc_amt);
    msg!("OUTPUT_ACC_AMT: {:?}", output_acc_amt);

    Ok(())
}

#[cfg(test)]
mod tests {
    
}
