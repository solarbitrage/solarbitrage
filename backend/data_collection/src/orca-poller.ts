import { Network, OrcaPoolToken } from "@orca-so/sdk";
import { OrcaPoolImpl } from "@orca-so/sdk/dist/model/orca/pool/orca-pool";
import Decimal from "decimal.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import config from "./common/src/config";
import { fetchWithTimeout } from "./common/src/fetch-timeout";
import { useConnection } from "./common/src/connection";
import { listeners } from "./common/src/orca-utils/constants";
import { formatDistance } from "date-fns"
import fetch from "node-fetch";

const SLEEP_TIME = 800;

const getNextConnection = (poolName: string) => useConnection(false, {
  fetch: (url, opts) => fetchWithTimeout(fetch, url, {...opts, timeout: SLEEP_TIME * 4}),
  },
  poolName);

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Firebase Configuration
const firebaseConfig = {
  apiKey: config.FIREBASE_API_KEY,
  authDomain: config.FIREBASE_DOMAIN,
  databaseURL: config.FIREBASE_DATABASE_URL,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const orcaRequests = async () => {
  // Initialzie Orca object with appropriate network connection
  const myArgs = process.argv.slice(2).map((item) => parseInt(item));

  console.log("Gathering ORCA data");

  const listenerSlice = listeners.slice(...myArgs);
  const lastUpdatedMap = {};
  for (const [, poolId] of listenerSlice) {
    lastUpdatedMap[poolId] = {
      date: new Date(),
      rpc: 0,
      rtt: 0
    };
  }

  setInterval(() => {
    console.table(Object.keys(lastUpdatedMap).map((poolId) => ({
      "Pool ID": poolId,
      "Last Checked": lastUpdatedMap[poolId] ? formatDistance(lastUpdatedMap[poolId].date, new Date(), { addSuffix: true, includeSeconds: true }) : "~",
      "RPC": lastUpdatedMap[poolId] ? lastUpdatedMap[poolId].rpc : "~",
      "RTT": lastUpdatedMap[poolId] ? lastUpdatedMap[poolId].rtt : "~"
    })));
  }, 5000);

  
  // Gather swapping data
  await Promise.allSettled(
    listenerSlice.map(async ([pool, poolId]) => {
      const currencyLastRate = {
        buy: undefined,
        sell: undefined
      };
      for (;;) {
        try {
          const startTime = new Date().getTime();
          const connection = getNextConnection(poolId)();
          const currentPool = new OrcaPoolImpl(connection, Network.MAINNET, pool);

          const coinA = currentPool.getTokenA();
          const coinB = currentPool.getTokenB();

          const tradingAmount = new Decimal(1);
          const buyQuote = await Promise.race([
            currentPool.getQuote(coinB, tradingAmount),
            new Promise<undefined>((_, rej) => setTimeout(() => rej(new Error("getQuote Timeout")), SLEEP_TIME * 4))
          ])

          lastUpdatedMap[poolId].date = new Date();
          const buyRate = buyQuote.getExpectedOutputAmount().toNumber();
          const sellRate = 1 / buyQuote.getExpectedOutputAmount().toNumber() * (0.9940071);

          // If the currency rate actually changed
          if ( currencyLastRate[poolId] === undefined
            || currencyLastRate[poolId].buy !== buyRate
            || currencyLastRate[poolId].sell !== sellRate) {
            currencyLastRate[poolId] = {
              buy: buyRate,
              sell: sellRate
            }
            // Update Firebase Real-time Database
            updateDatabase(
              poolId,
              pool.address.toBase58(),
              buyRate,
              sellRate,
              coinA,
              coinB
            );

            lastUpdatedMap[poolId].rtt = `${new Date().getTime() - startTime}ms`;
            lastUpdatedMap[poolId].rpc = connection.rpcEndpoint;
            

            console.log(poolId, lastUpdatedMap[poolId].rtt, buyRate, sellRate, connection.rpcEndpoint);
          }
        } catch (e) {
          console.error(poolId, e.message);
        }
        await sleep(SLEEP_TIME);
      }
    })
  );

};

function updateDatabase(
  poolName: string,
  poolAddr: string,
  buyQuote: number,
  sellQuote: number,
  coinA: OrcaPoolToken,
  coinB: OrcaPoolToken
) {
  const results = {
    provider: "ORCA",
    pool_addr: poolAddr,
    buy: {
      rate: buyQuote,
      rate_raw: buyQuote.toFixed(15),
      from: coinB.tag,
      to: coinA.tag,
    },
    sell: {
      rate: sellQuote,
      rate_raw: sellQuote.toFixed(15),
      from: coinA.tag,
      to: coinB.tag,
    },
  };

  update(ref(database, "latest_prices/" + poolName), results);
}

signInWithEmailAndPassword(auth, config.FIREBASE_EMAIL, config.FIREBASE_PASSWORD)
  .then(() => {
    // Signed in..
    console.log("Signed in!");
    orcaRequests()
    .then(() => {
      console.log("Done");
    })
    .catch((e) => {
      console.error(e);
    });
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
    // ...
  });

