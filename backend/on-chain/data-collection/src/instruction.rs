// instruction.rs
// Attempts to decode the instructions given to the program

// Unsure if we need this module. Will keep here though.

use std::convert::TryInto;
use solana_program::program_error::ProgramError;
use crate::error::DataCollectionInstruction::InvalidInstruction;

use solana_program::{
    msg,
};

pub enum DataCollectionInstruction {
    
}