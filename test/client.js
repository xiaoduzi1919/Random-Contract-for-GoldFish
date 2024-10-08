const solanaWeb3 = require('@solana/web3.js');  
const borsh = require('borsh');  
const fs = require('fs');  
  
// Load a keypair from a local file  
function loadKeypairFromFile(filePath) {  
    const secretKeyString = fs.readFileSync(filePath, 'utf8');  
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));  
    return solanaWeb3.Keypair.fromSecretKey(secretKey);  
}  
  
// Define the Borsh Schema for ProofAccount  
class ProofAccount {  
    constructor(properties = {}) {  
        this.counter = properties.counter || 0;  
        this.level = properties.level || 0;  
    }  
}  
  
const ProofSchema = new Map([  
    [ProofAccount, { kind: 'struct', fields: [['counter', 'u32'], ['level', 'u32']] }],  
]);  
  
// Create or connect to a Solana network  
const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');  
  
// Load the payer keypair from a file  
const payer = loadKeypairFromFile('src/id.json');  
  
const GREETING_SEED = 'goldfish';  
const PROGRAM_ID = new solanaWeb3.PublicKey('G9rXZbpsDDDW1spghnmFALJ7k8MCjfdcjthXwDdfj2Tj'); // Replace with your program ID  
  
async function main() {  
    // Get or derive the public key for the related account  
    const programId = PROGRAM_ID;  
    const greetedPubkey = await solanaWeb3.PublicKey.createWithSeed(  
        payer.publicKey,  
        GREETING_SEED,  
        programId  
    );  
  
    // Check if the account already exists  
    const greetedAccount = await connection.getAccountInfo(greetedPubkey);  
  
    console.log('account', greetedPubkey.toBase58());  
    if (greetedAccount === null) {  
        console.log('Creating account', greetedPubkey.toBase58());  
        const lamports = await connection.getMinimumBalanceForRentExemption(  
            borsh.serialize(ProofSchema, new ProofAccount()).length  
        );  
        const transaction = new solanaWeb3.Transaction().add(  
            solanaWeb3.SystemProgram.createAccountWithSeed({  
                fromPubkey: payer.publicKey,  
                basePubkey: payer.publicKey,  
                seed: GREETING_SEED,  
                newAccountPubkey: greetedPubkey,  
                lamports,  
                space: borsh.serialize(ProofSchema, new ProofAccount()).length,  
                programId,  
            })  
        );  
  
        await solanaWeb3.sendAndConfirmTransaction(connection, transaction, [payer]);  
    }  
  
    // Create an instruction to call the program  
    const instruction = new solanaWeb3.TransactionInstruction({  
        keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: greetedPubkey, isSigner: false, isWritable: true }],  
        programId,  
        data: Buffer.alloc(0), // No additional data needed  
    });  
  
    // Send the transaction  
    await solanaWeb3.sendAndConfirmTransaction(  
        connection,  
        new solanaWeb3.Transaction().add(instruction),  
        [payer]  
    );  
  
    // Fetch and deserialize the account data  
    const accountInfo = await connection.getAccountInfo(greetedPubkey);  
    if (accountInfo === null) {  
        throw 'Error: cannot find the greeted account';  
    }  
    const greeting = borsh.deserialize(ProofSchema, ProofAccount, accountInfo.data);  
    console.log('Greeting count:', greeting.counter);  
    console.log('Greeting level:', greeting.level);  
}  
  
main().catch((err) => {  
    console.error(err);  
});