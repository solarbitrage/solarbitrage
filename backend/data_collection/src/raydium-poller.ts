import fetch from "node-fetch";
import {
  Liquidity,
  LiquidityPoolJsonInfo,
  jsonInfo2PoolKeys,
  TokenAmount,
  Token,
  Percent,
  WSOL,
} from "@raydium-io/raydium-sdk";

import { MAINNET_SPL_TOKENS } from "./common/src/raydium-utils/tokens";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import _ from "lodash";

import config from "./common/src/config";
import { getRate } from "./common/src/raydium-utils/raydium-rate-funcs";
import {
  RAYDIUM_POOLS_ENDPOINT,
  listeners,
  poolMintAddrToName,
  moreUnofficialLpPools,
} from "./common/src/raydium-utils/constants";
import { useConnection } from "./common/src/connection";
import { fetchWithTimeout } from "./common/src/fetch-timeout";
import { formatDistance } from "date-fns";

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

// Hot patches to token info
MAINNET_SPL_TOKENS["SOL"] = {
  ...WSOL,
};

MAINNET_SPL_TOKENS["ETH"] = {
  ...MAINNET_SPL_TOKENS["ETH"],
  decimals: 8,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Connection info

const getNextConnection = useConnection(false, {
  fetch: (url, opts) => fetchWithTimeout(fetch, url, {...opts, timeout: 8000}),
});

function updateDatabase(poolName, data) {
  return set(ref(database, "latest_prices/" + poolName), data);
}

(async () => {
  const lpMetadata = await fetch(RAYDIUM_POOLS_ENDPOINT).then((res) =>
    res.json()
  );
  const allLpPools: LiquidityPoolJsonInfo[] = [
    ...lpMetadata["official"],
    ...lpMetadata["unOfficial"],
    ...moreUnofficialLpPools,
  ];
  const lpPools = allLpPools
    .filter((val) => listeners.includes(val.id))
    .map((p) => jsonInfo2PoolKeys(p));

  const myArgs = process.argv.slice(2).map(item => parseInt(item));

  const listenerSlice = lpPools.slice(...myArgs);
  const lastUpdatedMap = {};
  for (const pool of listenerSlice) {
    lastUpdatedMap[poolMintAddrToName[pool.id.toBase58()]] = null;
  }

  setInterval(() => {
    console.table(Object.keys(lastUpdatedMap).map((poolId) => ({
      "Pool ID": poolId,
      "Last Checked": lastUpdatedMap[poolId] ? formatDistance(lastUpdatedMap[poolId], new Date(), { addSuffix: true, includeSeconds: true }) : "~",
    })));
  }, 5000);

  let rpcLastRate = {};

  return Promise.all(
    listenerSlice.map(async (pool) => {
      for (;;) {
        try {
          const connection = getNextConnection();

          const poolInfo =  await Promise.race([
            Liquidity.fetchInfo({
              connection,
              poolKeys: pool
            }),
            new Promise<undefined>((_, rej) => setTimeout(() => rej(new Error("fetchInfo Timeout")), 8000))
          ]);

          const poolName = poolMintAddrToName[pool.id.toBase58()];
          lastUpdatedMap[poolName] = new Date();
          const coinTickers = poolName.split("_").slice(1);

          const amountOut = getRate(
            pool,
            poolInfo,
            MAINNET_SPL_TOKENS[coinTickers[1]],
            MAINNET_SPL_TOKENS[coinTickers[0]],
            1
          );

          const parsedAmountOut =
            amountOut.amountOut.raw.toNumber() /
            Math.pow(10, MAINNET_SPL_TOKENS[coinTickers[0]].decimals);

          const results = {
            provider: "RAYDIUM",
            network_fees: 10000,
          };

          const sellResults = {
            ...results,
            rate_raw: `${1 / parsedAmountOut}`,
            from: coinTickers[0],
            rate: 1 / parsedAmountOut,
            to: coinTickers[1],
          };

          const buyResults = {
            ...results,
            rate_raw: `${parsedAmountOut}`,
            rate: parsedAmountOut,
            from: coinTickers[1],
            to: coinTickers[0],
          };

          const poolResults = {
            provider: "RAYDIUM",
            pool_addr: pool.id.toBase58(),
            buy: {
              ...buyResults,
            },
            sell: {
              ...sellResults,
            },
          };

          console.log(
            `${poolName}`,
            amountOut.minAmountOut.currency.decimals
          );

          if (rpcLastRate[connection.rpcEndpoint] === null || rpcLastRate[connection.rpcEndpoint] !== parsedAmountOut) {
            rpcLastRate[connection.rpcEndpoint] = parsedAmountOut;
            updateDatabase(`${poolName}`, poolResults);
          }

        } catch (e) {
          console.error(e);
        }  
        await sleep(200);
      }
    })
  );
})().catch((e) => console.error("FATAL ERROR:", e));
