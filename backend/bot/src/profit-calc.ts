import { initializeApp } from 'firebase/app';
import { getDatabase, ref, child, get, onValue, onChildChanged, query, update} from "firebase/database";

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

let local_database: any =  {};

// function to set up local copy of the database
async function run_pools()
{
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
  console.log("init query");
  local_database = queries;
});

// function to update pool prices from real time changes in firebase
const updated_pools = ref(database, 'latest_prices/');
onChildChanged(updated_pools, (snapshot) => {
  const data = snapshot.val();
  local_database[snapshot.key] = data;

  // -------------- getting all USDC pools and computing profit --------------

  //  look for string that has USDC 
  console.log("Polling ...")
  let USDCpools = Object.entries(local_database).filter(([key, value]) => {
    return key.includes('USDC')
  })

  let ORCA_POOLS=[], RAYDIUM_POOLS=[];
  // let ORCA_POOLS = ["ORCA_ETH_USDC", "ORCA_LIQ_USDC", "ORCA_PORT_USDC", "ORCA_RAY_USDC", "ORCA_SNY_USDC", "ORCA_SOL_USDC"]
  // let RAYDIUM_POOLS = ["RAYDIUM_ETH_USDC", "RAYDIUM_LIQ_USDC", "RAYDIUM_PORT_USDC", "RAYDIUM_RAY_USDC", "RAYDIUM_SNY_USDC", "RAYDIUM_SOL_USDC"]

  USDCpools.forEach(pair => {
    if(pair[0].startsWith("ORCA_")){
      ORCA_POOLS.push(pair[0].substring(5))
    }
    else{
      RAYDIUM_POOLS.push(pair[0].substring(8))
    }
  })
  // console.log(`Orca pools: ${ORCA_POOLS}`)
  // console.log(`Raydium pools: ${RAYDIUM_POOLS}`)
  const overlapPools = ORCA_POOLS.filter(value => RAYDIUM_POOLS.includes(value));
  // console.log(`filtered: ${overlapPools}`)
  overlapPools.forEach(pool => {
    profit_in_pool(4, pool)
  });

  // -------------- getting all USDC pools and computing profit --------------
});

function profit_in_pool(STARTING_USDC_BET, pool:string){
  let ORCA_POOL = "ORCA_" + pool;
  let RAYDIUM_POOL = "RAYDIUM_" + pool;
  let SLIPPAGE = 0.01
  let usdc = STARTING_USDC_BET;

    let estimatedProfits = {
        "Raydium then Orca": ((1 * local_database[RAYDIUM_POOL].buy.rate * (1 - SLIPPAGE)) * local_database[ORCA_POOL].sell.rate    * (1 - SLIPPAGE)) - 1,
        "Orca then Raydium": ((1 * local_database[ORCA_POOL].buy.rate    * (1 - SLIPPAGE)) * local_database[RAYDIUM_POOL].sell.rate * (1 - SLIPPAGE)) - 1
    }
  
  // console.log("Estimated Profit", estimatedProfits, "Rates", { "Raydium then Orca": [local_database[RAYDIUM_POOL].buy.rate, local_database[ORCA_POOL].sell.rate], "Orca then Raydium": [local_database[ORCA_POOL].buy.rate, local_database[RAYDIUM_POOL].sell.rate]})
  if (estimatedProfits["Raydium then Orca"] > estimatedProfits["Orca then Raydium"]){
    console.log(`${pool} Estimated Profit per usdc: ${estimatedProfits['Raydium then Orca']} (Raydium then Orca)`)
  }
  else{
    console.log(`${pool} Estimated Profit per usdc: ${estimatedProfits['Orca then Raydium']} (Orca then Raydium)`)
  }
  console.log('.')
}