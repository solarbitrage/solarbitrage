import { readFile } from "mz/fs";
import { jsonInfo2PoolKeys, MAINNET_SPL_TOKENS, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { NATIVE_SOL, swap } from "./raydium-swap-funcs";

import { initializeApp } from 'firebase/app';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { collection, getFirestore, addDoc, serverTimestamp} from "firebase/firestore";
import { getDatabase, ref, child, get, onValue, onChildChanged, query, update} from "firebase/database";
import { getOrca, OrcaFarmConfig, OrcaPoolConfig, Network } from "@orca-so/sdk";
import { getDevnetPool } from "@orca-so/sdk/dist/public/devnet"
import Decimal from "decimal.js";

// ~~~~~~ firebase configs ~~~~~~
let config = require('../firebase_config')
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
    const data = snapshot.val();
    local_database[snapshot.key] = data;

    //function that runs caclculations anytime there's a change
    while(!ready_to_trade){
    }
    // if(ready_to_trade)
    // call below only when swap is done
        calculate_trade(snapshot.key);
    
    console.log("going to check new change")
});

function calculate_trade(update?){
    console.log("Calculating ...")

    let usdc = 1;  // base value of $1
    let rate_diff = Math.abs(local_database.ORCA_SOL_USDC.sell.rate - local_database.RAYDIUM_SOL_USDC.sell.rate);
    // run swaps based on this below threshold
    if(rate_diff > 0.1){                            // rate always > 0.1. take into account slippage?
    if(local_database.ORCA_SOL_USDC.sell.rate < local_database.RAYDIUM_SOL_USDC.sell.rate){

        usdc += rate_diff;
        console.log("Buy from Raydium, Sell to Orca");
        main("Raydium","Orca",0.01,local_database.RAYDIUM_SOL_USDC.buy.rate)
            .then(() => {
                console.log("Done");
            })
            .catch((e) => {
                console.error(e);
            });
    }
    else{
        usdc += rate_diff;
        console.log("Buy from Orca, Sell to Raydium");
        main("Orca","Raydium",0.01,local_database.ORCA_SOL_USDC.buy.rate)
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

const main = async (startPool, endPool, fromCoinAmount, rate) => {
    // first set flag to false
    ready_to_trade = false;

    /*** Setup ***/
    // 1. Read secret key file to get owner keypair
    const secretKeyString = await readFile("/Users/noelb/my-solana-wallet/wallet-keypair.json", {
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

    // conditions for AMM trade direction 
    try{
        if(startPool === "Raydium"){
            // USDC -> SOL on Raydium
            // minimum_expected_ouput = (fromCoinAmount * conversion rate * (1 - slippage))
            const toCoinAmount = (fromCoinAmount * rate * (1-0.05)).toString();
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
            // maybe creat
            // SOL -> USDC on Orca
            const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);
            const solToken = solUSDCPool.getTokenA();
            const solAmount = new Decimal((+toCoinAmount));  // getting $1 0.01038672
            const usdcQuote = await solUSDCPool.getQuote(solToken, solAmount);
            const usdcAmountbuy = usdcQuote.getMinOutputAmount();
            // console.log(usdcQuote.getExpectedOutputAmount());

            console.log(`Swapping  ${solAmount.toString()} SOL for at least ${usdcAmountbuy.toNumber()} USDC`);
            const swap3 = await solUSDCPool.swap(owner, solToken, solAmount, usdcAmountbuy);
            const swapId3 = await swap3.execute();

            console.log("Swapped: ", swapId3);
            console.log("-------------------------\n");

        }
        else{
            // USDC -> SOL on Orca
            const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);
            const solToken = solUSDCPool.getTokenB();
            const solAmount = new Decimal(fromCoinAmount.toDecimal());  // getting $1 0.01038672
            const usdcQuote = await solUSDCPool.getQuote(solToken, solAmount);
            const usdcAmountbuy = usdcQuote.getMinOutputAmount();
            // console.log(usdcQuote.getExpectedOutputAmount());

            console.log(`Swapping  ${solAmount.toString()} USDC for at least ${usdcAmountbuy.toNumber()} SOL`);
            const swap3 = await solUSDCPool.swap(owner, solToken, solAmount, usdcAmountbuy);
            const swapId3 = await swap3.execute();

            console.log("Swapped: ", swapId3);
            console.log("-------------------------\n");

            // SOL -> USDC on Raydium
            const toCoinAmount = (usdcAmountbuy.toNumber() * (1-0.05)).toString();
            fromCoinAmount = usdcAmountbuy.toNumber().toString();
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
        }
        // set flag to true again
        ready_to_trade = true;
    }catch (err) {
        console.warn(err);
    }
}