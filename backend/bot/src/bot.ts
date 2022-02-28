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
  calculate_trade();
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
  calculate_trade(snapshot.key);
});
// calculate function

function calculate_trade(update?){
// console.log(local_database, update)
  console.log("Calculating ...")

//   let fromUSDC = Object.entries(local_database).filter(([key, value]) =>{
//    return value.from === 'USDC'
//   })

// fromUSDC.forEach(pair=>{
//   pair = pair[1]

// })

  let rates = []
  // console.log(local_database);
  rates[0] = local_database.ORCA_SOL_USDC_BUY.rate;
  rates[1] = local_database.ORCA_SOL_USDC_SELL.rate;
  rates[2] = local_database.RAYDIUM_SOL_USDC_SELL.rate;

  // have rate_diff? don't trade till above base value?
  // rn calculate() called at any update in database -> not on sol_usdc pool of Raydium and Orca.
  // 
  let buy_from:string, sell_to:string;
  let usdc = 1;  // base value of $1
  let rate_diff = Math.abs(local_database.ORCA_SOL_USDC_SELL.rate - local_database.RAYDIUM_SOL_USDC_SELL.rate);
  if(rate_diff > 0.1){
    if(local_database.ORCA_SOL_USDC_SELL.rate < local_database.RAYDIUM_SOL_USDC_SELL.rate){
      // buy sol from ORCA and sell sol to get usdc 
      usdc = usdc*local_database.RAYDIUM_SOL_USDC_BUY.rate;
      usdc = usdc*local_database.ORCA_SOL_USDC_SELL.rate;   
      buy_from = "RAYDIUM_SOL_USDC";
      sell_to = "ORCA_SOL_USDC";
      console.log("Buy from Raydium, Sell to Orca");
    }
    else{
      usdc = usdc*local_database.ORCA_SOL_USDC_BUY.rate;
      usdc = usdc*local_database.RAYDIUM_SOL_USDC_SELL.rate;
      buy_from = "ORCA_SOL_USDC";
      sell_to = "RAYDIUM_SOL_USDC";
      console.log("Buy from Orca, Sell to Raydium");
    }
    console.log("Resulting USDC amount: " , usdc);
  }
  else{
    console.log("Not worth the trade\n");
  }

  // write to firestore
  // try {
  //   const docRef = await addDoc(collection(firestore, "profitability_evaluation_history"), {
  //     buy_from: buy_from,
  //     sell_to: sell_to,
  //     net_profit_rate: usdc,
  //     time_stamp: serverTimestamp()
  //   });
  //   console.log("Document written with ID: ", docRef.id);
  // } catch (e) {
  //   console.error("Error adding document: ", e);
  // }