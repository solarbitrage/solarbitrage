import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { closeAccount } from "@project-serum/serum/lib/token-instructions";
import { jsonInfo2PoolKeys, MAINNET_SPL_TOKENS, SPL_ACCOUNT_LAYOUT, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import Decimal from "decimal.js";
import { initializeApp } from 'firebase/app';
import { get, getDatabase, onChildChanged, ref } from "firebase/database";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import { readFile } from "mz/fs";
// ~~~~~~ firebase configs ~~~~~~
import config from "./common/src/config";
import { swap as orcaSwap } from "./orca-swap-funcs";
import { NATIVE_SOL, swap as raydiumSwap } from "./raydium-swap-funcs";
import { createTokenAccountIfNotExist } from "./raydium-utils/web3";


const firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_DOMAIN,
    databaseURL: config.FIREBASE_DATABASE_URL,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
// Get a reference to the database service
const database = getDatabase(app);
const firestore = getFirestore(app);
// ~~~~~~ firebase configs ~~~~~~

const WALLET_KEY_PATH = process.env.WALLET_KEY_PATH ?? "/Users/noelb/my-solana-wallet/wallet-keypair.json"
const SLIPPAGE = 0.01;
const THRESHOLD = 0.02;
const STARTING_USDC_BET = 4

let ready_to_trade = true;  // flag to look for updates only when a swap intruction is done

// SOL_USDC Raydium token
const SOL_USDC_JSON = {
    "id": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
    "baseMint": "So11111111111111111111111111111111111111112",
    "quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "lpMint": "8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu",
    "version": 4,
    "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "authority": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    "openOrders": "HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc",
    "targetOrders": "CZza3Ej4Mc58MnxWA385itCC9jCo3L1D7zc3LKy1bZMR",
    "baseVault": "DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz",
    "quoteVault": "HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz",
    "withdrawQueue": "G7xeGGLevkRwB5f44QNgQtrPKBdMfkT6ZZwpS9xcC97n",
    "lpVault": "Awpt6N7ZYPBa4vG4BQNFhFxDj4sxExAA9rpBAoBw2uok",
    "marketVersion": 3,
    "marketProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "marketId": "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
    "marketAuthority": "F8Vyqk3unwxkXukZFQeYyGmFfTG3CAX4v24iyrjEYBJV",
    "marketBaseVault": "36c6YqAwyGKQG66XEp2dJc5JqjaBNv7sVghEtJv4c7u6",
    "marketQuoteVault": "8CFo8bL8mZQK8abbFyypFMwEDd8tVJjHTTojMLgQTUSZ",
    "marketBids": "14ivtgssEBoBjuZJtSAPKYgpUK7DmnSwuPMqJoVTSgKJ",
    "marketAsks": "CEQdAFKdycHugujQg9k2wbmxjcpdYZyVLfV9WerTnafJ",
    "marketEventQueue": "5KKsLVU6TcbVDK4BS6K1DGDxnh4Q9xjYJ8XaDCG5t8ht"
}
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

const connection = new Connection("https://api.mainnet-beta.solana.com", "singleGossip");
const orca = getOrca(connection);
const poolKeys = jsonInfo2PoolKeys(SOL_USDC_JSON);
let owner: Keypair;
let wSOLAccount: PublicKey;

let local_database: any = {};

// function to set up local copy of the database
async function query_pools() {
    const latest_price = ref(database, 'latest_prices/');
    return get(latest_price).then((snapshot) => {
        if (!snapshot.exists()) throw new Error("Snapshot doesn't exist");
        return snapshot.val();
    })
}

async function main() {
    // ==== Setup 
    // Read secret key file to get owner keypair
    const secretKeyString = await readFile(WALLET_KEY_PATH, {
        encoding: "utf8",
    });

    // local_database setup
    const queries = await query_pools();
    console.log("local_database setup");
    local_database = queries;

    // get wallet credentials
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    owner = Keypair.fromSecretKey(secretKey);
    console.log("wallet creds");

    // setup wrapped SOL account
    wSOLAccount = await setupWSOLTokenAccount();
    console.log("setup WSOL Token Account");

    // initial trade calculation
    calculate_trade();

    // ==== Start listener
    const updated_pools = ref(database, 'latest_prices/');
    onChildChanged(updated_pools, (snapshot) => {
        // console.log("snapshot", snapshot)
        //  console.log("key", snapshot.key)
        const data = snapshot.val();
        local_database[snapshot.key] = data;

        //function that runs caclculations anytime there's a change
        // while(!ready_to_trade){

        // }
        if (ready_to_trade) {
            calculate_trade(snapshot.key);
            console.log("going to check new change")
        }

    });
}

main().then(() => {}).catch(e => console.error(e))

function calculate_trade(update?) {
    // console.log(local_database, update)
    console.log("Calculating ...")

    // rn calculate() called at any update in database -> not on sol_usdc pool of Raydium and Orca.
    let usdc = STARTING_USDC_BET;  // base value of $1

    let estimatedProfits = {
        "Raydium then Orca": ((1 * local_database.RAYDIUM_SOL_USDC.buy.rate * (1 - SLIPPAGE)) * local_database.ORCA_SOL_USDC.sell.rate    * (1 - SLIPPAGE)) - 1,
        "Orca then Raydium": ((1 * local_database.ORCA_SOL_USDC.buy.rate    * (1 - SLIPPAGE)) * local_database.RAYDIUM_SOL_USDC.sell.rate * (1 - SLIPPAGE)) - 1
    }
    console.log("Estimated Profit", estimatedProfits, "Rates", { "Raydium then Orca": [local_database.RAYDIUM_SOL_USDC.buy.rate, local_database.ORCA_SOL_USDC.sell.rate], "Orca then Raydium": [local_database.ORCA_SOL_USDC.buy.rate, local_database.RAYDIUM_SOL_USDC.sell.rate]})

    // run swaps based on this below threshold
    if (estimatedProfits["Raydium then Orca"] > estimatedProfits["Orca then Raydium"] && estimatedProfits["Raydium then Orca"] > THRESHOLD) {
        console.log("Buy from Raydium, Sell to Orca");
        orcaRaydiumArbitrage("Raydium", usdc, local_database.RAYDIUM_SOL_USDC.buy.rate, local_database.ORCA_SOL_USDC.sell.rate, usdc + estimatedProfits["Raydium then Orca"])
            .then(() => {
                console.log("Done");
            })
            .catch((e) => {
                console.error(e);
            });
    } else if (estimatedProfits["Orca then Raydium"] > estimatedProfits["Raydium then Orca"] && estimatedProfits["Orca then Raydium"] > THRESHOLD) {
        console.log("Buy from Orca, Sell to Raydium");

        // I need to send the rate for both swap directions
        orcaRaydiumArbitrage("Orca", usdc, local_database.ORCA_SOL_USDC.buy.rate, local_database.RAYDIUM_SOL_USDC.sell.rate, usdc + estimatedProfits["Orca then Raydium"])
            .then(() => {
                console.log("Done");
            })
            .catch((e) => {
                console.error(e);
            });
    } else {
        console.log("Not worth the trade\n");
    }
}


// 1st set up local database
// update database on changes, if change is found, calculate the rate differences to check for profitable trades
// if profitable trade exists, conduct a swap.
// only after a swap is done, look for another database update?

const orcaRaydiumArbitrage = async (startPool, fromCoinAmount, exchangeArate, exchangeBrate, _expected_usdc) => {
    console.log( { startPool, fromCoinAmount, exchangeArate, exchangeBrate, _expected_usdc })
    // first set flag to false
    ready_to_trade = false;

    const tokenAccounts = await getTokenAccounts();

    // conditions for AMM trade direction 
    // RPC is not catching up to the latest block. wait some time for node to catch up?
    try {
        if (startPool === "Raydium") {
            // USDC -> SOL on Raydium
            const newSOL = fromCoinAmount * exchangeArate * (1 - SLIPPAGE);

            const fromToken = MAINNET_SPL_TOKENS["USDC"];
            const toToken = NATIVE_SOL;

            const {wrappedSolAcc, ...res} = await raydiumSwap(
                connection,
                owner,
                poolKeys,
                fromToken,
                toToken,
                tokenAccounts[fromToken.mint]?.tokenAccountAddress,
                tokenAccounts[toToken.mint]?.tokenAccountAddress,
                fromCoinAmount.toString(),
                newSOL.toString(),
                tokenAccounts[WSOL.mint]?.tokenAccountAddress
            );
            
            // SOL -> USDC on Orca
            const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);
            const solToken = solUSDCPool.getTokenA();
            const solAmount = new Decimal(newSOL);  // getting $1 0.01038672

            // const usdcQuote = await solUSDCPool.getQuote(solToken, solAmount);
            // const usdcAmountbuy = usdcQuote.getMinOutputAmount();
            // console.log(usdcQuote.getExpectedOutputAmount());

            const {transactionPayload} = await orcaSwap(solUSDCPool, owner, solToken, solAmount, new Decimal(_expected_usdc), wrappedSolAcc);
           
            res.transaction.add(transactionPayload.transaction);

            console.log(JSON.stringify(res.transaction))

            const transactionId = await sendAndConfirmTransaction(connection, res.transaction, [...res.signers, ...transactionPayload.signers], {commitment:"finalized",maxRetries:5, skipPreflight: true});
            console.log({ transactionId });
            console.log("Raydium then Orca Swap Complete");
        }
        else {
            // USDC -> SOL on Orca
            const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);

            const usdcToken = solUSDCPool.getTokenB();
            const usdcAmount = new Decimal(fromCoinAmount);  // getting SOL worth $1 ... 0.01038672

            // console.log(usdcQuote.getExpectedOutputAmount());
            const newSOL = (fromCoinAmount * exchangeArate * (1 - SLIPPAGE));

            console.log(`Swapping  ${usdcAmount.toString()} USDC for ${newSOL} SOL`);
            const { transactionPayload, wrappedSolAcc } = await orcaSwap(solUSDCPool, owner, usdcToken, usdcAmount, new Decimal(newSOL), new PublicKey(tokenAccounts[WSOL.mint]?.tokenAccountAddress));

            // SOL -> USDC on Raydium
            const toCoinAmount = newSOL * (exchangeBrate) * (1 - SLIPPAGE);
            const fromToken = NATIVE_SOL;
            const toToken = MAINNET_SPL_TOKENS["USDC"];
            
            const res = await raydiumSwap(
                connection,
                owner,
                poolKeys,
                fromToken,
                toToken,
                tokenAccounts[fromToken.mint]?.tokenAccountAddress,
                tokenAccounts[toToken.mint]?.tokenAccountAddress,
                newSOL.toString(),
                toCoinAmount.toString(),
                wrappedSolAcc.toBase58()
            );

            transactionPayload.transaction.add(res.transaction);

            console.log(JSON.stringify(transactionPayload.transaction))

            const transactionId = await sendAndConfirmTransaction(connection, transactionPayload.transaction, [...transactionPayload.signers, ...res.signers], {commitment:"finalized", maxRetries:5, skipPreflight: true});
            
            console.log({ transactionId });
            console.log("ORCA then Raydium Swap Complete")
        }

        // Repoll for token account data
        const afterTokenAccounts = await getTokenAccounts();
        if (!afterTokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint])
            throw new Error("No USDC token account!");

        const parsedInfo = afterTokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint]?.parsedInfo;
        console.log("parsedInfo", parsedInfo)
        const net_usdc = parseFloat(parsedInfo.tokenAmount.uiAmount);
        
        write_to_database(fromCoinAmount, net_usdc, _expected_usdc);
    } catch (err) {
        console.warn(err);
    }
    // set flag to true again
    ready_to_trade = true;
}


// write to firestore
async function write_to_database(_start: number, _end: number, _expected_profit: number) {
    try {
        const docRef = await addDoc(collection(firestore, "trade_history"), {
            starting_amount: _start,
            ending_amount: _end,
            net_profit: (_end - _start),
            expected_profit: _expected_profit,
            time_stamp: serverTimestamp()
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function getTokenAccounts() {
    const accounts = await connection.getParsedTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID })

    // token account for Raydium
    const tokenAccounts = {};
    for (const tokenAccountInfo of accounts.value) {
        const tokenAccountPubkey = tokenAccountInfo.pubkey
        const tokenAccountAddress = tokenAccountPubkey.toBase58()
        const parsedInfo = tokenAccountInfo.account.data.parsed.info
        const mintAddress = parsedInfo.mint
        const balance = new TokenAmount(parsedInfo.tokenAmount.amount, parsedInfo.tokenAmount.decimals)

        tokenAccounts[mintAddress] = {
            tokenAccountAddress,
            balance,
            parsedInfo
        }
    }

    return tokenAccounts;
}

async function setupWSOLTokenAccount() {
    const tokenAccounts = await getTokenAccounts();
    const currentSOLBalance = await connection.getBalance(owner.publicKey);

    let solBalanceInAccount = 0;
    const balanceNeededFoRentExcemption = await connection.getMinimumBalanceForRentExemption(SPL_ACCOUNT_LAYOUT.span);

    const transaction = new Transaction();
    const signers = [];

    signers.push(owner)
    
    if (tokenAccounts[WSOL.mint]) {
        transaction.add(closeAccount({
            source: new PublicKey(tokenAccounts[WSOL.mint].tokenAccountAddress),
            destination: owner.publicKey,
            owner: owner.publicKey,
        }));
        solBalanceInAccount += tokenAccounts[WSOL.mint].balance.wei;
        return new PublicKey(tokenAccounts[WSOL.mint].tokenAccountAddress);
    }

    const lamportsToPutInAcc = Math.max((currentSOLBalance  + solBalanceInAccount) * 0.8, balanceNeededFoRentExcemption);

    const wrappedSOLAcc = await createTokenAccountIfNotExist(
        connection,
        null,
        owner.publicKey,
        WSOL.mint,
        lamportsToPutInAcc,
        transaction,
        signers
    ) as PublicKey;


    const tx = await sendAndConfirmTransaction(connection, transaction, signers, { commitment: "singleGossip" });
    
    console.log("created WSOL acc: ", tx)

    return wrappedSOLAcc;
}