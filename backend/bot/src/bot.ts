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

let look_from:string, look_to:string, current_pool;
const updated_pools = ref(database, 'latest_prices/');
onChildChanged(updated_pools, (snapshot) => {
  // console.log("snapshot", snapshot)
//  console.log("key", snapshot.key)
  const data = snapshot.val();
  local_database[snapshot.key] = data;
  // find the pools with the oppsite direction of coins
  look_from = local_database[snapshot.key].to;
  look_to = local_database[snapshot.key].from;
  // console.log(snapshot.key);
  // console.log(local_database[snapshot.key].from)

  // look for the "from" and "to" and look for pools that have the inverse of from->to
  // run trades based on sell rates comparison 

  //function that runs caclculations anytime there's a change
  calculate_trade(snapshot.key);
});
// calculate function

// are we always starting from USDC_SOL? Or is only fixed thing is that we start with USDC
// thereby checking multiple pools starting "from:USDC" and comparing the respective pools to same pools in other AMMs

// are we checking usd->arbitrary coin a->usd?
  // only if multiple pools exist. 
  // in which case compare which arbitrary coin to select based on the greater rate difference?
  // scope is for later 

// get an array of all "from:USDC" and compare the rates between them? but right now only doing 2 trades (2 AMMs)
// so basically get the from and compare rates and swap between the two.
function calculate_trade(update?){
// console.log(local_database, update)
  console.log("Calculating ...")

  // let fromUSDC = Object.entries(local_database).filter(([key,value]) => {
  //  return value['from'] === 'USDC'
  // //  return value.from === 'look_from' && value.to === 'look_to'&& key.startsWith("ORCA") 
  // })
  // for (const [key, value] of Object.entries(local_database)) {
  //   console.log(`${key}: ${value['buy']['from']}`);
  // }
// fromUSDC.forEach(pair=>{
//   // pair = pair[1]
//   console.log("ooooooooooooooooo",pair[1])
// })

  // have rate_diff? don't trade till above base value?
  // rn calculate() called at any update in database -> not on sol_usdc pool of Raydium and Orca.
  // 
  let buy_from:string, sell_to:string;
  let usdc = 1;  // base value of $1
  let rate_diff = Math.abs(local_database.ORCA_SOL_USDC.sell.rate - local_database.RAYDIUM_SOL_USDC.sell.rate);
  // run swaps based on this below threshold
  if(rate_diff > 0.1){
    if(local_database.ORCA_SOL_USDC.sell.rate < local_database.RAYDIUM_SOL_USDC.sell.rate){
      usdc += rate_diff;
      console.log("Buy from Raydium, Sell to Orca");
    }
    else{
      usdc += rate_diff;
      console.log("Buy from Orca, Sell to Raydium");
    }
    console.log("Estimated net USDC amount: " , usdc);
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
// /*
}