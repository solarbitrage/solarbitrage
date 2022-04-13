import { readFile } from "mz/fs";
import { jsonInfo2PoolKeys, MAINNET_SPL_TOKENS, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { NATIVE_SOL, swap } from "./common/src/raydium-utils/raydium-swap-funcs";

import { initializeApp } from 'firebase/app';
import { Connection, Keypair } from "@solana/web3.js";
import { collection, getFirestore, addDoc, serverTimestamp} from "firebase/firestore";
import { getDatabase, ref, child, get, onValue, onChildChanged, query, update} from "firebase/database";
import { getOrca, OrcaFarmConfig, OrcaPoolConfig, Network } from "@orca-so/sdk";
import { getDevnetPool } from "@orca-so/sdk/dist/public/devnet"
import Decimal from "decimal.js";


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
const firestore = getFirestore(app);

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

const main = async () => {
  /*** Setup ***/
  // 1. Read secret key file to get owner keypair
  const secretKeyString = await readFile("/Users/noelb/my-solana-wallet/my-keypair.json", {
      encoding: "utf8",
    });
    // "6VgdQS12EqfS31LkG9ksveqQQAJjiVbZ2F7rMzc8Cdec"
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const owner = Keypair.fromSecretKey(secretKey);

  // 2. Initialzie Orca object with mainnet connection
  const connection = new Connection("https://api.devnet.solana.com", "singleGossip");
  const orca = getOrca(connection, Network.DEVNET);

  try {
    // // Getting USDC from SOL wallet
    // const pools = [
    //   OrcaPoolConfig.ORCA_USDC,
    //   OrcaPoolConfig.SOL_USDC,
    //   OrcaPoolConfig.BTC_USDC,
    //   OrcaPoolConfig.ORCA_SOL
    // ]

    /*** Swap ***/
    // 3. We will be swapping 0.1 SOL for some ORCA
    const orcaSolPool = orca.getPool(OrcaPoolConfig.ORCA_SOL);
    const solToken = orcaSolPool.getTokenB();
    const solAmount = new Decimal(0.1);
    const quote = await orcaSolPool.getQuote(solToken, solAmount);
    const orcaAmountbuy1 = quote.getMinOutputAmount();

    console.log(`Swapping ${solAmount.toString()} SOL for at least ${orcaAmountbuy1.toNumber()} ORCA`);
    const swapPayload = await orcaSolPool.swap(owner, solToken, solAmount, orcaAmountbuy1);
    const swapTxId = await swapPayload.execute();

    console.log("Swapped:", swapTxId, "\n");
    console.log("-------------------------\n");

    // ----------- Getting USDC from ORCA -------------
    const orcaUSDCPool = orca.getPool(OrcaPoolConfig.ORCA_USDC);
    const orcaTokensell = orcaUSDCPool.getTokenA();
    const orcaAmountsell1 = new Decimal(orcaAmountbuy1.toDecimal());  // getting $1 0.01038672
    const usdcQuote = await orcaUSDCPool.getQuote(orcaTokensell, orcaAmountsell1);
    const USDCAmountbuy = usdcQuote.getMinOutputAmount();
    
    console.log(`Swapping ${orcaAmountsell1.toString()} ORCA for at least ${USDCAmountbuy.toNumber()} USDC`);
    const swap2 = await orcaUSDCPool.swap(owner, orcaTokensell, orcaAmountsell1, USDCAmountbuy);
    const swapId2 = await swap2.execute();
    
    console.log("Swapped: ", swapId2);
    console.log("-------------------------\n");
    // ----------- Getting USDC from ORCA -------------

    // no matter what can't go from USDC -> SOL ...?
    // works for USDC <-> ORCA && SOL <-> ORCA

    // ----------- Getting ORCA from USDC -------------
    const usdcTokensell = orcaUSDCPool.getTokenB();
    const usdcAmountsell = new Decimal(USDCAmountbuy.toDecimal());  // getting $1 0.01038672
    const orcaQuote = await orcaUSDCPool.getQuote(usdcTokensell, usdcAmountsell);
    const orcaAmountbuy2 = orcaQuote.getMinOutputAmount();
    console.log(orcaQuote.getExpectedOutputAmount());
    
    console.log(`Swapping  ${usdcAmountsell.toString()} USDC for at least ${orcaAmountbuy2.toNumber()} ORCA`);
    const swap3 = await orcaUSDCPool.swap(owner, usdcTokensell, usdcAmountsell, orcaAmountbuy2);
    const swapId3 = await swap3.execute();

    console.log("Swapped: ", swapId3);
    console.log("-------------------------\n");
    // ----------- Getting ORCA from USDC -------------

    // ----------- Getting SOL from ORCA -------------
    const orcaToken = orcaSolPool.getTokenA();
    const orcaAmountsell2 = new Decimal(orcaAmountbuy2.toDecimal());
    const solquote = await orcaSolPool.getQuote(orcaToken, orcaAmountsell2);
    const solAmountbuy = solquote.getMinOutputAmount();

    console.log(`Swapping ${orcaAmountsell2.toString()} ORCA for at least ${solAmountbuy.toNumber()} SOL`);
    const swap4 = await orcaSolPool.swap(owner, orcaToken, orcaAmountsell2, solAmountbuy);
    const swapId4 = await swap4.execute();

    console.log("Swapped:", swapId4, "\n");
    console.log("----------Completed a round of swapping---------------\n");

    write_to_database(0.1, solAmountbuy.toNumber());
    // ----------- Getting SOL from ORCA -------------


    // ----------- Getting BTC from USDC -------------
    // const BTCUSDCsellPool = orca.getPool(OrcaPoolConfig.BTC_USDC);
    // const usdc_BTC_Tokensell = BTCUSDCsellPool.getTokenB();
    // const usdc_BTC_Amountsell = new Decimal(1);  // get 
    // const btcQuote = await BTCUSDCsellPool.getQuote(usdc_BTC_Tokensell, usdc_BTC_Amountsell);
    // const btcAmountbuy = btcQuote.getMinOutputAmount();

    // console.log(`Swapping  ${usdc_BTC_Amountsell.toString()} USDC for at least ${btcAmountbuy.toNumber()} BTC`);
    // const swap4 = await BTCUSDCsellPool.swap(owner, usdc_BTC_Tokensell, usdc_BTC_Amountsell, btcAmountbuy);
    // const swapId4 = await swap4.execute();
    // console.log("\n swap id: ", swapId4);
    // ----------- Getting BTC from USDC -------------
  } catch (err) {
    console.warn(err);
  }
};

// main()
//   .then(() => {
//     console.log("Done");
//   })
//   .catch((e) => {
//     console.error(e);
//   });

setInterval(()=>main()
.then(() => {
  console.log("Done");
})
.catch((e) => {
  console.error(e);
}), 1800000);

// setInterval(main, 30000);
// var intervalID = setInterval(myCallback, 5000, 'Parameter 1', 'Parameter 2');

// function myCallback(a, b)
// {
//  // Your code here
//  // Parameters are purely optional.
//  console.log(a);
//  console.log(b);
// }

// write to firestore
async function write_to_database(_start:number, _end:number){
  try {
    const docRef = await addDoc(collection(firestore, "trade_history"), {
      starting_amount : _start,
      ending_amount : _end,
      net_profit: (_end - _start),
      time_stamp: serverTimestamp()
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Rogan X
//   The code on the SDK readme does work, you just need to be really careful with how you're making the swaps. From an account with only SOL, you can swap from SOL -> ORCA, and then you'll be able to make swaps SOL -> ORCA -> USDC on devnet (the pool ratios are messed up and do not reflect mainnet prices, but the swap functionality works)
// To get it working, I had to start from a fresh project (yarn init -y and then yarn add @orca-so/sdk @solana/web3.js decimal - copy and paste the README code block, and then remove the mz/fs import and use a byte array private key instead).
// The devnet pools are different from the mainnet pools

// In case somebody runs in the same problem, it fixed itself by updating the orca package.





// const main = async (startPool, endPool, fromCoinAmount) => {

//     // first set flag to false
//     ready_to_trade = false;
//     /*** Setup ***/
//     // 1. Read secret key file to get owner keypair
//     const secretKeyString = await readFile("/Users/noelb/my-solana-wallet/my-keypair.json", {
//         encoding: "utf8",
//     });
//     // "6VgdQS12EqfS31LkG9ksveqQQAJjiVbZ2F7rMzc8Cdec"
//     const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
//     const owner = Keypair.fromSecretKey(secretKey);

//     // 2. Initialzie Orca object with mainnet connection
//     const connection = new Connection("https://api.devnet.solana.com", "singleGossip");
//     const orca = getOrca(connection, Network.DEVNET);

//     try{
//         // 3. We will be swapping 0.1 SOL for some ORCA
//         const orcaSolPool = orca.getPool(OrcaPoolConfig.ORCA_SOL);
//         const solToken = orcaSolPool.getTokenB();
//         const solAmount = new Decimal(0.1);
//         const quote = await orcaSolPool.getQuote(solToken, solAmount);
//         const orcaAmountbuy1 = quote.getMinOutputAmount();

//         console.log(`Swapping ${solAmount.toString()} SOL for at least ${orcaAmountbuy1.toNumber()} ORCA`);
//         const swapPayload = await orcaSolPool.swap(owner, solToken, solAmount, orcaAmountbuy1);
//         const swapTxId = await swapPayload.execute();
//         console.log("here")

//         console.log("Swapped:", swapTxId, "\n");
//         console.log("-------------------------\n");

//     }catch (err) {
//         console.warn(err);
//     }
//     // set flag to true again
//     ready_to_trade = true;
// };
