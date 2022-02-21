import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaPoolConfig, Network } from "@orca-so/sdk";
import Decimal from "decimal.js";

import { initializeApp, deleteApp } from "firebase/app";
import { getDatabase, ref, set, update, serverTimestamp } from "firebase/database";

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

const orcaRequests = async () => {
  // Read secret key file to get owner keypair
  const secretKeyString = await readFile("wallets/test-keypair.json", {
    encoding: "utf8",
  });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const owner = Keypair.fromSecretKey(secretKey);

  // Initialzie Orca object with appropriate network connection
  // Production: https://api.mainnet-beta.solana.com, getOrca(connection)
  // Development: https://api.devnet.solana.com, getOrca(connection, Network.DEVNET)
  const connection = new Connection("https://api.mainnet-beta.solana.com", "singleGossip");
  const orca = getOrca(connection)

  try {
    console.log('Gathering ORCA data')
    const pools = [
      OrcaPoolConfig.SOL_USDC,
    ]

    // Gather swapping data
    pools.forEach(async function(pool) {
      const currentPool = orca.getPool(pool);

      const coinToken = currentPool.getTokenA();
      const usdcToken = currentPool.getTokenB();

      const tradingAmount = new Decimal(1);
      const buyQuote = await currentPool.getQuote(usdcToken, tradingAmount);
      const sellQuote = await currentPool.getQuote(coinToken, tradingAmount);

      // Update Firebase Real-time Database
      const poolName = Object.keys(OrcaPoolConfig).find(key => OrcaPoolConfig[key] === pool)
      updateDatabase('ORCA_' + poolName + '_BUY', buyQuote);
      updateDatabase('ORCA_' + poolName + '_SELL', sellQuote);

      console.log('Update complete')
      console.log('Waiting until next call')
      console.log('\n')

      setTimeout(orcaRequests, 5000)
    })
  } catch (err) {
    console.warn(err);
  }
};

function updateDatabase(poolName, quote) {
  update(ref(database, 'latest_prices/' + poolName), {
    expected_output_amount: quote.getExpectedOutputAmount().toNumber(),
    lp_fees: quote.getLPFees().toNumber(),
    min_output_amount: quote.getMinOutputAmount().toNumber(),
    network_fees: quote.getNetworkFees().toNumber(),
    price_impact: quote.getPriceImpact().toNumber(),
    rate: quote.getRate().toNumber(),
  });
}

orcaRequests()
  .then(() => {
    console.log("Done");
  })
  .catch((e) => {
    console.error(e);
  });