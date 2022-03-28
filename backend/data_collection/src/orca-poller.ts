import { getOrca, OrcaPoolConfig, OrcaPoolToken, Quote } from "@orca-so/sdk";
import { Keypair } from "@solana/web3.js";
import Decimal from "decimal.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";
import { readFile } from "mz/fs";
import config from "./common/src/config";
import { useConnection } from "./common/src/connection";



const getNextConnection = useConnection();

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
  
  // Initialzie Orca object with appropriate network connection
  const connection = getNextConnection();
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
      updateDatabase('ORCA_' + poolName, buyQuote, sellQuote, coinA, coinB)
    }
  } catch (err) {
    console.warn(err);
  }
  setTimeout(orcaRequests, 250)
};

function updateDatabase(poolName: string, buyQuote: Quote, sellQuote: Quote, coinA: OrcaPoolToken, coinB: OrcaPoolToken) {
  const results = {
    "buy": {
      expected_output_amount: buyQuote.getExpectedOutputAmount().toNumber(),
      lp_fees: buyQuote.getLPFees().toNumber(),
      min_output_amount: buyQuote.getMinOutputAmount().toNumber(),
      network_fees: buyQuote.getNetworkFees().toNumber(),
      price_impact: buyQuote.getPriceImpact().toNumber(),
      rate: parseFloat(buyQuote.getRate().toFixed(15)),
      rate_raw: buyQuote.getRate().toFixed(15),
      from: coinB.tag,
      to: coinA.tag
    }, 
    "sell": {
      expected_output_amount: sellQuote.getExpectedOutputAmount().toNumber(),
      lp_fees: sellQuote.getLPFees().toNumber(),
      min_output_amount: sellQuote.getMinOutputAmount().toNumber(),
      network_fees: sellQuote.getNetworkFees().toNumber(),
      price_impact: sellQuote.getPriceImpact().toNumber(),
      rate: parseFloat(sellQuote.getRate().toFixed(15)),
      rate_raw: sellQuote.getRate().toFixed(15),
      from: coinA.tag,
      to: coinB.tag     
    }
  };

  console.log(poolName, results)

  update(ref(database, 'latest_prices/' + poolName), results);
};

orcaRequests()
  .then(() => {
    console.log("Done");
  })
  .catch((e) => {
    console.error(e);
  });