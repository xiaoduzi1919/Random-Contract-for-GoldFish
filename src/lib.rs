use borsh::{BorshDeserialize, BorshSerialize};
use std::str::FromStr;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{clock::Clock, Sysvar},
};

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct ProofAccount {
    /// number of greetings
    pub counter: u32,
    //fish level
    pub level: u32,
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {

    msg!("Welcome to Gold Fish Game");

    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let signer_account = next_account_info(accounts_iter)?;

    //Predefined specific wallet address
    let allowed_pubkey = Pubkey::from_str("HJJdwyMVf2m5Scr6cVjdEJF9GNVrqaPbw2i51ET7Tr1n").unwrap();

    //Check if the signer is a specific wallet
    if !signer_account.is_signer || *signer_account.key != allowed_pubkey {
        msg!("Unauthorized signer");
        return Err(ProgramError::IllegalOwner);
    }

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;
    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Proof account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let clock = Clock::get()?;
    let timestamp = clock.unix_timestamp as u64;
    let slot_height: u64 = clock.slot;

    let easy_random_number = timestamp + slot_height;

    // Increment and store the number of times the account has been greeted
    let mut proof_account = ProofAccount::try_from_slice(&account.data.borrow())?;
    proof_account.counter += 1;


    msg!("Now timestamp: {}",timestamp);

    msg!("Now slot height: {}",slot_height);

    if easy_random_number % 2 == 1 {
        proof_account.level = 1;
        msg!("Upgrade failed !");
    } else {
        proof_account.level += 1;
        msg!("Upgrade successful ！");
    }

    proof_account.serialize(&mut *account.data.borrow_mut())?;

    msg!("Upgrade {} time(s)!", proof_account.counter);

    msg!("Fish level  {} ", proof_account.level);

    Ok(())
}
