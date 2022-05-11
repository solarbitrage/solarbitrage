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
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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

const SLEEP_TIME = 800;

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
const auth = getAuth(app);

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Connection info

const getNextConnection = (poolName: string) => useConnection(false, {
  fetch: (url, opts) => fetchWithTimeout(fetch, url, {...opts, timeout: SLEEP_TIME * 4}),
  },
  poolName);

function updateDatabase(poolName, data) {
  return set(ref(database, "latest_prices/" + poolName), data);
}

signInWithEmailAndPassword(auth, config.FIREBASE_EMAIL, config.FIREBASE_PASSWORD)
  .then(() => {
    // Signed in..
    console.log("Signed in!");
    
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
        lastUpdatedMap[poolMintAddrToName[pool.id.toBase58()]] = {
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
    
      return Promise.all(
        listenerSlice.map(async (pool) => {
          const currencyLastRate = {
            buy: undefined,
            sell: undefined
          };
          for (;;) {
            try {
              const startTime = new Date().getTime();
              const connection = getNextConnection(poolMintAddrToName[pool.id.toBase58()])();
    
              const poolInfo =  await Promise.race([
                Liquidity.fetchInfo({
                  connection,
                  poolKeys: pool
                }),
                new Promise<undefined>((_, rej) => setTimeout(() => rej(new Error("fetchInfo Timeout")), SLEEP_TIME * 4))
              ]);
    
              const poolName = poolMintAddrToName[pool.id.toBase58()];
              lastUpdatedMap[poolName].date = new Date();
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
              
              const amountIn = getRate(
                pool,
                poolInfo,
                MAINNET_SPL_TOKENS[coinTickers[0]],
                MAINNET_SPL_TOKENS[coinTickers[1]],
                1
              );
              
              const parsedAmountIn =
                amountIn.amountOut.raw.toNumber() /
                Math.pow(10, MAINNET_SPL_TOKENS[coinTickers[1]].decimals);
    
              const results = {
                provider: "RAYDIUM",
                network_fees: 10000,
              };
    
              const buyResults = {
                ...results,
                rate_raw: `${parsedAmountOut}`,
                rate: parsedAmountOut,
                from: coinTickers[1],
                to: coinTickers[0],
              };
    
              const sellResults = {
                ...results,
                rate_raw: `${parsedAmountIn}`,
                from: coinTickers[0],
                rate: parsedAmountIn,
                to: coinTickers[1],
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

              lastUpdatedMap[poolName].rpc = connection.rpcEndpoint;
              lastUpdatedMap[poolName].rtt = `${new Date().getTime() - startTime}ms`;
    
              if (currencyLastRate[poolName] === undefined 
                || currencyLastRate[poolName].buy !== parsedAmountOut
                || currencyLastRate[poolName].sell !== parsedAmountIn) {
                currencyLastRate[poolName] = {
                  buy: parsedAmountOut,
                  sell: parsedAmountIn
                }
    
                console.log(
                  `${poolName}`,
                  lastUpdatedMap[poolName].rtt,
                  amountOut.minAmountOut.currency.decimals,
                  parsedAmountOut,
                  parsedAmountIn,
                  connection.rpcEndpoint
                );
    
                updateDatabase(`${poolName}`, poolResults);
              }
    
            } catch (e) {
              console.error(e.message);
            }  
            await sleep(SLEEP_TIME);
          }
        })
      );
    })().catch((e) => console.error("FATAL ERROR:", e));

  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
    // ...
  });
