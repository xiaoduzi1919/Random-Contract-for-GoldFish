const solanaWeb3 = require('@solana/web3.js');  
const borsh = require('borsh');  
const fs = require('fs');  
  
// Function to load a keypair from a file  
function loadKeypairFromFile(filePath) {  
    const secretKeyString = fs.readFileSync(filePath, 'utf8');  
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));  
    return solanaWeb3.Keypair.fromSecretKey(secretKey);  
}  
  
// Class representing a greeting account  
class GreetingAccount {  
    constructor(properties = {}) {  
        this.counter = properties.counter || 0;  
        this.level = properties.level || 0;  
    }  
}  
  
// Define the schema for the GreetingAccount using Borsh  
const GreetingSchema = new Map([  
    [GreetingAccount, { kind: 'struct', fields: [['counter', 'u32'], ['level', 'u32']] }],  
]);  
  
// Establish a connection to the Solana devnet  
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');  
  
// Load user and payer keypairs from files  
const user = loadKeypairFromFile('/src/id1.json');  
const payer = loadKeypairFromFile('/src/id2.json');  
  
const GREETING_SEED = 'goldfish';  
const PROGRAM_ID = new solanaWeb3.PublicKey('Aw8cXg8VFBsw568FuXvszYCvXRaMWqCR6N418DyzDVqS'); // Replace with your program ID  
  
async function main() {  
  
    const programId = PROGRAM_ID;  
      
    // Uncomment the following lines to derive the greeted pubkey from the payer's pubkey, seed, and program ID  
    /*  
    const greetedPubkey = await solanaWeb3.PublicKey.createWithSeed(  
        payer.publicKey,  
        GREETING_SEED,  
        programId  
    );*/  
  
    // Alternatively, use a predefined greeted pubkey for testing  
    const greetedPubkey = new solanaWeb3.PublicKey("GeTyVeaRVyqPZQFgsuf4Lv6jLicK67SzgaaEy22hVLuV");  
  
    // Check if the account already exists  
    const greetedAccount = await connection.getAccountInfo(greetedPubkey);  
      
    // Create an instruction to call the program  
    const instruction = new solanaWeb3.TransactionInstruction({  
        keys: [{ pubkey: user.publicKey, isSigner: true, isWritable: false }, { pubkey: greetedPubkey, isSigner: false, isWritable: true }],  
        programId,  
        data: Buffer.alloc(0), // No data to send in this instruction  
    });  
  
    // Send and confirm the transaction  
    await solanaWeb3.sendAndConfirmTransaction(  
        connection,  
        new solanaWeb3.Transaction().add(instruction),  
        [user] // Signers for the transaction  
    );  
  
    // Fetch the account info again to ensure it's updated  
    const accountInfo = await connection.getAccountInfo(greetedPubkey);  
    if (accountInfo === null) {  
        throw 'Error: cannot find the greeted account';  
    }  
      
    // Deserialize the account data using Borsh  
    const greeting = borsh.deserialize(GreetingSchema, GreetingAccount, accountInfo.data);  
    console.log('Greeting count:', greeting.counter);  
    console.log('Greeting level:', greeting.level);  
}  
  
// Execute the main function and catch any errors  
main().catch((err) => {  
    console.error(err);  
});