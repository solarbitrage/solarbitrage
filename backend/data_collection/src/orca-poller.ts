import { Network, OrcaPoolToken } from "@orca-so/sdk";
import { OrcaPoolImpl } from "@orca-so/sdk/dist/model/orca/pool/orca-pool";
import Decimal from "decimal.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";
import config from "./common/src/config";
import { fetchWithTimeout } from "./common/src/fetch-timeout";
import { useConnection } from "./common/src/connection";
import { listeners } from "./common/src/orca-utils/constants";
import { formatDistance } from "date-fns"
import fetch from "node-fetch";


const getNextConnection = useConnection(true, {
  fetch: (url, opts) => fetchWithTimeout(fetch, url, {...opts, timeout: 8000}),
});

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
const database = getDatabase(app);

const orcaRequests = async () => {
  // Initialzie Orca object with appropriate network connection
  const myArgs = process.argv.slice(2).map((item) => parseInt(item));

  console.log("Gathering ORCA data");

  const listenerSlice = listeners.slice(...myArgs);
  const lastUpdatedMap = {};
  for (const [_, poolId] of listenerSlice) {
    lastUpdatedMap[poolId] = null;
  }

  setInterval(() => {
    console.table(Object.keys(lastUpdatedMap).map((poolId) => ({
      "Pool ID": poolId,
      "Last Checked": lastUpdatedMap[poolId] ? formatDistance(lastUpdatedMap[poolId], new Date(), { addSuffix: true, includeSeconds: true }) : "~",
    })));
  }, 5000);

  let rpcLastRate = {};

  // Gather swapping data
  await Promise.allSettled(
    listenerSlice.map(async ([pool, poolId]) => {
      for (;;) {
        try {
          const connection = getNextConnection();
          const currentPool = new OrcaPoolImpl(connection, Network.MAINNET, pool);

          const coinA = currentPool.getTokenA();
          const coinB = currentPool.getTokenB();

          const tradingAmount = new Decimal(1);
          const buyQuote = await Promise.race([
            currentPool.getQuote(coinB, tradingAmount),
            new Promise<undefined>((_, rej) => setTimeout(() => rej(new Error("getQuote Timeout")), 8000))
          ])
          lastUpdatedMap[poolId] = new Date();
          const buyRate = buyQuote.getExpectedOutputAmount().toNumber();
          const sellRate = 1 / buyQuote.getExpectedOutputAmount().toNumber();

          // Only checking buy rate here because the sell rate here depends on the buy rate anyways.
          if (rpcLastRate[connection.rpcEndpoint] === null || rpcLastRate[connection.rpcEndpoint] !== buyRate) {
            rpcLastRate[connection.rpcEndpoint] = buyRate;
            // Update Firebase Real-time Database
            updateDatabase(
              poolId,
              pool.address.toBase58(),
              buyRate,
              sellRate,
              coinA,
              coinB
            );
          }
        } catch (e) {
          console.error(e);
        }
        await sleep(400);
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

  console.log(poolName);

  update(ref(database, "latest_prices/" + poolName), results);
}

orcaRequests()
  .then(() => {
    console.log("Done");
  })
  .catch((e) => {
    console.error(e);
  });
