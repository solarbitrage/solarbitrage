import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaPoolConfig, Network } from "@orca-so/sdk";
import Decimal from "decimal.js";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";

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
      OrcaPoolConfig.ORCA_USDC,
      OrcaPoolConfig.SOL_USDC,
      OrcaPoolConfig.BTC_USDC,
      OrcaPoolConfig.ORCA_SOL,
    ]

    // Gather swapping data
    for (const pool of pools) {
      const currentPool = orca.getPool(pool);

      const coinA = currentPool.getTokenA();
      const coinB = currentPool.getTokenB();

      const tradingAmount = new Decimal(1);
      const [buyQuote, sellQuote] = await Promise.all([currentPool.getQuote(coinB, tradingAmount), currentPool.getQuote(coinA, tradingAmount)]);
      
      // Update Firebase Real-time Database
      const poolName = Object.keys(OrcaPoolConfig).find(key => OrcaPoolConfig[key] === pool)
      updateDatabase('ORCA_' + poolName + '_BUY', buyQuote, coinB, coinA)
      updateDatabase('ORCA_' + poolName + '_SELL', sellQuote, coinA, coinB);

      console.log('Update complete')
      console.log('Waiting until next call')
      console.log('\n')
    }
  } catch (err) {
    console.warn(err);
  }
  setTimeout(orcaRequests, 1000)
};

function updateDatabase(poolName, quote, fromToken, toToken) {
  update(ref(database, 'latest_prices/' + poolName), {
    expected_output_amount: quote.getExpectedOutputAmount().toNumber(),
    lp_fees: quote.getLPFees().toNumber(),
    min_output_amount: quote.getMinOutputAmount().toNumber(),
    network_fees: quote.getNetworkFees().toNumber(),
    price_impact: quote.getPriceImpact().toNumber(),
    rate: quote.getRate().toNumber(),
    from: fromToken.tag,
    to: toToken.tag
  });
}

orcaRequests()
  .then(() => {
    console.log("Done");
  })
  .catch((e) => {
    console.error(e);
  });