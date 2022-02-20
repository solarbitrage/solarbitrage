import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaPoolConfig, Network } from "@orca-so/sdk";
import Decimal from "decimal.js";

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

import config from "./config"

// Firebase Configuration
const firebaseConfig = {
  apiKey: config.FIREBASE_API_KEY,
  authDomain: config.FIREBASE_DOMAIN,
  databaseURL: config.FIREBASE_DATABASE_URL,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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