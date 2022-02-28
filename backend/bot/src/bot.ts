import { initializeApp } from 'firebase/app';
import { getDatabase, ref, child, get, onValue, onChildChanged, query, update} from "firebase/database";
import { collection, getFirestore, addDoc, serverTimestamp} from "firebase/firestore";
import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaFarmConfig, OrcaPoolConfig, Network } from "@orca-so/sdk";  
import Decimal from "decimal.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// import config from "./firebase_config"
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

  // don't do swap. NOtify best paths to making profit. based on raydium and orca
      // keep local copy of database. keep a real time listerer to firebase and update local copy of database with changed values
  // possibly still try doing swaps between orca pools to test out swaps. and test out net profit or loss after trade
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
const database = getDatabase(app);
const firestore = getFirestore(app);

let local_database: any =  {};

async function run_pools()
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

run_pools().then((queries)=>{
  // console.log(queries[ORCA_USDC_SELL]);
  console.log("init query");
  local_database = queries;
  calculate();
});


const starCountRef = ref(database, 'latest_prices/');
onChildChanged(starCountRef, (snapshot) => {
  // console.log("snapshot", snapshot)
//  console.log("key", snapshot.key)
  const data = snapshot.val();
  local_database[snapshot.key] = data;
  // updateStarCount(postElement, data);
  console.log(data);
  console.log('\n ------------------------------- \n')

  //function that runs caclculations anytime there's a change
  calculate(snapshot.key);
});
// --------------------------------------test------------------------------------------------------------

// var intervalID = setInterval(run_pools, 6000);



function calculate(update?){
// console.log(local_database, update)
  console.log("we calculating")

  //find triange
  //start usdc
  //come back to usdc

//   let fromUSDC = Object.entries(local_database).filter(([key, value]) =>{
//    return value.from === 'USDC'
//   })

// fromUSDC.forEach(pair=>{
//   pair = pair[1]

// })

  let rates = []
  console.log(local_database);
  rates[0] = local_database.ORCA_SOL_USDC_BUY.rate;
  rates[1] = local_database.ORCA_SOL_USDC_SELL.rate;
  rates[2] = local_database.RAYDIUM_SOL_USDC_SELL.rate;

  if(local_database.ORCA_SOL_USDC_SELL.rate !==  local_database.RAYDIUM_SOL_USDC_SELL.rate){
    //hacked the system
    //buy
    // multiply usdc * rate of orca
    // trade based on a threshold of 
    // console.log("estimated profit per coin", Math.abs((local_database.ORCA_SOL_USDC_SELL.rate -  local_database.RAYDIUM_SOL_USDC_SELL.rate)));
    console.log("Buy SOL with USDC from", (local_database.ORCA_SOL_USDC_SELL.rate > local_database.RAYDIUM_SOL_USDC_SELL.rate) ? "Orca":"Raydium");
    let usdc = 1;  // base value of $1
    if(local_database.ORCA_SOL_USDC_SELL.rate < local_database.RAYDIUM_SOL_USDC_SELL.rate){
      // buy sol from ORCA and sell sol to get usdc 
      usdc = usdc*local_database.RAYDIUM_SOL_USDC_SELL.rate;
      usdc = usdc*local_database.ORCA_SOL_USDC_BUY.rate;
    }
    else{
      usdc = usdc*local_database.ORCA_SOL_USDC_SELL.rate;
      usdc = usdc*local_database.RAYDIUM_SOL_USDC_BUY.rate;
    }
    console.log("Resulting USDC amount: " , usdc);

  //   addDoc(collection(firestore, "profitability_evaluation_history"), {
  //     // from, to, amm, timestamp
  // })
  }
  // console.log(fromUSDC, "frm usd")
}

// console.log(p.ORCA_USDC_SELL);


// --------------------------------------test------------------------------------------------------------

// const main = async () => {
//   /*** Setup ***/
//   // 1. Read secret key file to get owner keypair
//   const secretKeyString = await readFile("/Users/noelb/my-solana-wallet/my-keypair.json", {
//       encoding: "utf8",
//     });
//     // "6VgdQS12EqfS31LkG9ksveqQQAJjiVbZ2F7rMzc8Cdec"
//   const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
//   const owner = Keypair.fromSecretKey(secretKey);

//   // 2. Initialzie Orca object with devnet connection
//   const connection = new Connection("https://api.devnet.solana.com", "singleGossip");
//   const orca = getOrca(connection, Network.DEVNET);

//   try {
//     const pools = [
//       OrcaPoolConfig.SOL_USDC,
//       OrcaPoolConfig.ORCA_SOL,
//       OrcaPoolConfig.ORCA_USDC
//     ]
//     const query_pools = ['SOL_USDC_BUY/', 'ORCA_SOL_BUY/', 'ORCA_USDC_SELL/'];

//     // Getting USDC from SOL wallet
//     const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);
//     const solTokensell = solUSDCPool.getTokenA();
//     const solAmountsell = new Decimal(0.011139);  // getting $1
//     const solquotesell = await solUSDCPool.getQuote(solTokensell, solAmountsell);
//     const USDCAmountbuy = solquotesell.getMinOutputAmount();
    
//     console.log(`Swapertoto ${solAmountsell.toString()} SOL for at least ${USDCAmountbuy.toNumber()} USDC`);
//     const swap = await solUSDCPool.swap(owner, solTokensell, solAmountsell, USDCAmountbuy);
//     const swapped = await swap.execute();
//     console.log("\n swap id: ", swapped)
//     // Getting USDC from SOL wallet

//     // const orcaUSDCPool = orca.getPool(OrcaPoolConfig.ORCA_USDC);
//     // const USDCToken = orcaUSDCPool.getTokenB();
//     // const USDCAmount = new Decimal(1);
//     // const USDCquote = await orcaUSDCPool.getQuote(USDCToken, USDCAmount);
//     // const USDCorcaAmount = USDCquote.getMinOutputAmount();

//     // const orcaSolPool = orca.getPool(OrcaPoolConfig.ORCA_SOL);
//     // const solToken = orcaSolPool.getTokenB();
//     // const solAmount = new Decimal(0.1);
//     // const solquote = await orcaSolPool.getQuote(solToken, solAmount);
//     // const orcaAmount = solquote.getMinOutputAmount();

//     // console.log(`Swapertoto ${solAmount.toString()} SOL for at least ${orcaAmount.toNumber()} ORCA`);
//     // const swapPayload = await orcaSolPool.swap(owner, solToken, solAmount, orcaAmount);
//     // const swapTxId = await swapPayload.execute();

//     // console.log("Swapped:", swapTxId, "\n");

//   } catch (err) {
//     console.warn(err);
//   }
// };

// main()
//   .then(() => {
//     console.log("Done");
//   })
//   .catch((e) => {
//     console.error(e);
//   });


// const latest_price = ref(database, 'latest_prices/ORCA_'+'ORCA_SOL_USDC_BUY/');
// get(latest_price).then((snapshot)=>{
//   if (snapshot.exists()) {
//     console.log(snapshot.val());
//   } else {
//     console.log("No data available");
//   }
// }).catch((error)=>{
//   console.error(error);
// });
// onValue(latest_price, (snapshot) => {
  // const data = snapshot.val().key;
  // console.log(snapshot.size, snapshot.val());
  // snapshot.forEach(snap => {
  //   console.log(snap.val());
  // })
//   updateStarCount(postElement, data);
// });

// const dbRef = ref(getDatabase());
// get(child(dbRef, `users/${userId}`)).then((snapshot) => {
//   if (snapshot.exists()) {
//     console.log(snapshot.val());
//   } else {
//     console.log("No data available");
//   }
// }).catch((error) => {
//   console.error(error);
// });



// var intervalID = setInterval(myCallback, 5000, 'Parameter 1', 'Parameter 2');

// function myCallback(a, b)
// {
//  // Your code here
//  // Parameters are purely optional.
//  console.log(a);
//  console.log(b);
// }