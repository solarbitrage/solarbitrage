import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { jsonInfo2PoolKeys, MAINNET_SPL_TOKENS, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { initializeApp } from 'firebase/app';
import { get, getDatabase, onChildChanged, ref } from "firebase/database";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import { readFile } from "mz/fs";
import { NATIVE_SOL, swap } from "./raydium-swap-funcs";

// ~~~~~~ firebase configs ~~~~~~
import config from "./common/src/config";

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

let local_database: any =  {};

// function to set up local copy of the database
async function query_pools()
{
  // const query_pools = ['SOL_USDC_BUY', 'ORCA_SOL_BUY', 'ORCA_USDC_SELL'];
  let query_objects = new Object();

    const latest_price = ref(database, 'latest_prices/');
    await get(latest_price).then((snapshot)=>{
      if (snapshot.exists()) {
        query_objects = snapshot.val();
      } else {
        console.log("No data available");
      }
    }).catch((error)=>{
      console.error(error);
    });
 return new Promise((resolve) =>{
   resolve(query_objects)
 })
}

query_pools().then((queries)=>{
    // console.log(queries[ORCA_USDC_SELL]);
    console.log("init query");
    local_database = queries;
    
    // calculate_trade();
});
// function to update pool prices from real time changes in firebase
const updated_pools = ref(database, 'latest_prices/');
onChildChanged(updated_pools, (snapshot) => {
    // console.log("snapshot", snapshot)
    //  console.log("key", snapshot.key)
    console.log("change in prices");
    const data = snapshot.val();
    local_database[snapshot.key] = data;

    //function that runs caclculations anytime there's a change
    // while(!ready_to_trade){
        
    // }
    if(ready_to_trade){
        calculate_trade(snapshot.key);
    }
    
    console.log("going to check new change")
});

function calculate_trade(update?){
    // console.log(local_database, update)
    console.log("Calculating ...")

    // rn calculate() called at any update in database -> not on sol_usdc pool of Raydium and Orca.
    let usdc = 4;  // base value of $1
    let rate_diff = Math.abs(local_database.ORCA_SOL_USDC.buy.rate - local_database.RAYDIUM_SOL_USDC.buy.rate);
    console.log("difference in rate: ", rate_diff);
    // run swaps based on this below threshold
    if(rate_diff > 0.00008){                   // rate always > 0.00001. take into account slippage? based on sol fees
        if(local_database.RAYDIUM_SOL_USDC.buy.rate > local_database.ORCA_SOL_USDC.buy.rate){

            // usdc += usdc*rate_diff;
            usdc = usdc * local_database.RAYDIUM_SOL_USDC.buy.rate * local_database.ORCA_SOL_USDC.sell.rate;
            console.log("Buy from Raydium, Sell to Orca");
            main("Raydium",usdc,local_database.RAYDIUM_SOL_USDC.buy.rate, local_database.ORCA_SOL_USDC.sell.rate, usdc)
                .then(() => {
                    console.log("Done");
                })
                .catch((e) => {
                    console.error(e);
                });
        }
        else{
            // usdc += rate_diff;
            usdc = usdc * local_database.ORCA_SOL_USDC.buy.rate * local_database.RAYDIUM_SOL_USDC.sell.rate;
            console.log("Buy from Orca, Sell to Raydium");
            // I need to send the rate for both swap directions
            main("Orca",usdc,local_database.ORCA_SOL_USDC.buy.rate, local_database.RAYDIUM_SOL_USDC.sell.rate, usdc)
                .then(() => {
                    console.log("Done");
                })
                .catch((e) => {
                    console.error(e);
                });
        }
        console.log("Estimated net USDC amount: " , usdc);
    }
    else{
    console.log("Not worth the trade\n");
    }
}


// 1st set up local database
// update database on changes, if change is found, calculate the rate differences to check for profitable trades
// if profitable trade exists, conduct a swap.
// only after a swap is done, look for another database update?

const main = async (startPool, fromCoinAmount, exchangeArate, exchangeBrate, _expected_usdc) => {
    // first set flag to false
    ready_to_trade = false;

    //  Setup 
    // 1. Read secret key file to get owner keypair
    const secretKeyString = await readFile(WALLET_KEY_PATH, {
        encoding: "utf8",
    });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const owner = Keypair.fromSecretKey(secretKey);

    // 2. Initialzie Orca object with mainnet connection
    const connection = new Connection("https://api.mainnet-beta.solana.com", "singleGossip");
    const orca = getOrca(connection);
    const poolKeys = jsonInfo2PoolKeys(SOL_USDC_JSON);

    const accounts = await connection.getParsedTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID })
    console.log(accounts)
    
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
            balance
        }
    }
    let previous_sol_balance = (await connection.getBalance(owner.publicKey)) * 0.000000001;
    // conditions for AMM trade direction 
    // RPC is not catching up to the latest block. wait some time for node to catch up?
    try{
        if(startPool === "Raydium"){
            // USDC -> SOL on Raydium
            // minimum_expected_ouput = (fromCoinAmount * conversion rate * (1 - slippage(1%)))
            const toCoinAmount = (fromCoinAmount * exchangeArate * (1-0.01)).toString();
            // const toCoinAmount = "0.00011987";
            fromCoinAmount = fromCoinAmount.toString();
            const fromToken = MAINNET_SPL_TOKENS["USDC"];
            const toToken = NATIVE_SOL;

            const res = await swap(
                connection, 
                owner, 
                poolKeys, 
                fromToken, 
                toToken, 
                tokenAccounts[fromToken.mint]?.tokenAccountAddress, 
                tokenAccounts[toToken.mint]?.tokenAccountAddress,
                fromCoinAmount,
                toCoinAmount,
                tokenAccounts[WSOL.mint]?.tokenAccountAddress
            );
            console.log(res);
            console.log("RAYDIUM swap done USDC -> SOL")
            let current_sol_balance = (await connection.getBalance(owner.publicKey)) * 0.000000001;

            // SOL -> USDC on Orca
            const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);
            const solToken = solUSDCPool.getTokenA();
            const solAmount = new Decimal((current_sol_balance - previous_sol_balance));  // getting $1 0.01038672
            const usdcQuote = await solUSDCPool.getQuote(solToken, solAmount);
            const usdcAmountbuy = usdcQuote.getMinOutputAmount();
            // console.log(usdcQuote.getExpectedOutputAmount());

            console.log(`Swapping  ${solAmount.toString()} SOL for at least ${usdcAmountbuy.toNumber()} USDC`);
            const swap3 = await solUSDCPool.swap(owner, solToken, solAmount, usdcAmountbuy);
            const swapId3 = await swap3.execute();

            console.log("Swapped: ", swapId3);
            console.log("ORCA swap done SOL -> USDC\n");

            // Repoll for token account data
            let net_usdc = 0; //
            for (const tokenAccountInfo of accounts.value) {
                const parsedInfo = tokenAccountInfo.account.data.parsed.info;
                net_usdc = parsedInfo.tokenAmount.uiAmount;
            }
            write_to_database(fromCoinAmount, net_usdc , _expected_usdc);

        }
        else{
            // USDC -> SOL on Orca
            const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);
            const solToken = solUSDCPool.getTokenB();
            const solAmount = new Decimal(fromCoinAmount.toDecimal());  // getting SOL worth $1 ... 0.01038672
            const usdcQuote = await solUSDCPool.getQuote(solToken, solAmount);
            const usdcAmountbuy = usdcQuote.getMinOutputAmount();
            // console.log(usdcQuote.getExpectedOutputAmount());

            console.log(`Swapping  ${solAmount.toString()} USDC for at least ${usdcAmountbuy.toNumber()} SOL`);
            const swap3 = await solUSDCPool.swap(owner, solToken, solAmount, usdcAmountbuy);
            const swapId3 = await swap3.execute();

            console.log("Swapped: ", swapId3);
            console.log("ORCA swap done USDC -> SOL\n");
            let current_sol_balance = (await connection.getBalance(owner.publicKey)) * 0.000000001;
            let net_sol = current_sol_balance - previous_sol_balance;

            // SOL -> USDC on Raydium
            const toCoinAmount = (net_sol * (exchangeBrate) * (1-0.01)).toString(); // slippage is 1%
            fromCoinAmount = net_sol.toString();
            const fromToken = NATIVE_SOL;
            const toToken = MAINNET_SPL_TOKENS["USDC"];

            const res = await swap(
                connection, 
                owner, 
                poolKeys, 
                fromToken, 
                toToken, 
                tokenAccounts[fromToken.mint]?.tokenAccountAddress, 
                tokenAccounts[toToken.mint]?.tokenAccountAddress,
                fromCoinAmount,
                toCoinAmount,
                tokenAccounts[WSOL.mint]?.tokenAccountAddress
            );
            console.log(res);
            console.log("RAYDIUM swap done SOL -> USDC")
            
            // Repoll for token account data
            let net_usdc = 0; //
            for (const tokenAccountInfo of accounts.value) {
                const parsedInfo = tokenAccountInfo.account.data.parsed.info;
                net_usdc = parsedInfo.tokenAmount.uiAmount;
            }
            write_to_database(fromCoinAmount, net_usdc , _expected_usdc);
        }
        // set flag to true again
        ready_to_trade = true;      // where to put this? in try-catch? or outside?
    }catch (err) {
        console.warn(err);
    }
}


// write to firestore
async function write_to_database(_start:number, _end:number, _expected_profit:number){
    try {
      const docRef = await addDoc(collection(firestore, "trade_history"), {
        starting_amount : _start,
        ending_amount : _end,
        net_profit: (_end - _start),
        expected_profit: _expected_profit,
        time_stamp: serverTimestamp()
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
}

