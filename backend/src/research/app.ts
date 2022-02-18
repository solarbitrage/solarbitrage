import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaFarmConfig, OrcaPoolConfig, Network } from "@orca-so/sdk";
import Decimal from "decimal.js";
// import { initializeApp } from "firebase/app";

require('dotenv').config()

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
/*const firebaseConfig = {
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: process.env.FIREBASE_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};*/

// Initialize Firebase
// const app = initializeApp(firebaseConfig);

const main = async () => {
  /*** Setup ***/
  // 1. Read secret key file to get owner keypair
  const secretKeyString = await readFile("wallets/test-keypair.json", {
    encoding: "utf8",
  });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const owner = Keypair.fromSecretKey(secretKey);

  // Initialzie Orca object with mainnet connection

  // Production Settings
  //const connection = new Connection("https://api.mainnet-beta.solana.com", "singleGossip");
  //const orca = getOrca(connection);
   
  // DevNet Settings
  const connection = new Connection("https://api.devnet.solana.com", "singleGossip");
  const orca = getOrca(connection, Network.DEVNET)

  try {
    const pools = [
      OrcaPoolConfig.SOL_USDC,
    ]

    // Gather swapping data
    pools.forEach(async function(pool) {
      const currentPool = orca.getPool(pool);

      const coinToken = currentPool.getTokenA();
      const usdcToken = currentPool.getTokenB();

      const tradingAmount = new Decimal(0.1);
      const buyQuote = await currentPool.getQuote(usdcToken, tradingAmount);
      const sellQuote = await currentPool.getQuote(coinToken, tradingAmount);

      console.log('Swap ' + tradingAmount + ' USDC for at least ' + buyQuote.getMinOutputAmount().toNumber() + ' SOL')
      console.log('Swap ' + tradingAmount + ' SOL for at least ' + sellQuote.getMinOutputAmount().toNumber() + ' USDC')

      // Update Firebase Real-time Database
      //const poolName = Object.keys(OrcaPoolConfig).find(key => OrcaPoolConfig[key] === pool)

    })
  } catch (err) {
    console.warn(err);
  }
};

main()
  .then(() => {
    console.log("Done");
  })
  .catch((e) => {
    console.error(e);
  });