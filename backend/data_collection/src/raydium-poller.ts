import fetch from "node-fetch";
import {
  Liquidity,
  LiquidityPoolJsonInfo,
  jsonInfo2PoolKeys,
  TokenAmount,
  MAINNET_SPL_TOKENS,
  Token,
  Percent,
  WSOL,
} from "@raydium-io/raydium-sdk";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

import config from "./common/src/config";
import { getRate } from "./common/src/raydium-utils/raydium-rate-funcs";
import { RAYDIUM_POOLS_ENDPOINT, listeners, poolMintAddrToName } from "./common/src/raydium-utils/constants";
import { useConnection } from "./common/src/connection";
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
  decimals: 8
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Connection info

const getNextConnection = useConnection();

function updateDatabase(poolName, data) {
  return set(ref(database, "latest_prices/" + poolName), data);
}

(async () => {
  const lpMetadata = await fetch(RAYDIUM_POOLS_ENDPOINT).then((res) =>
    res.json()
  );
  const allOfficialLpPools: LiquidityPoolJsonInfo[] = [
    ...lpMetadata["official"],
    ...lpMetadata["unOfficial"],
  ];
  const lpPools = allOfficialLpPools
    .filter((val) => listeners.includes(val.id))
    .map((p) => jsonInfo2PoolKeys(p));

  for (;;) {
    const dateString = new Date().toLocaleString()
    console.log(dateString, "-".repeat(Math.max(process.stdout.columns - dateString.length - 1, 0)))
    try {
      const connection = getNextConnection();
      const poolInfos = await Liquidity.fetchMultipleInfo({
        connection,
        pools: lpPools,
      });
      for (const [i, poolInfo] of poolInfos.entries()) {
        const coinTickers =
          poolMintAddrToName[lpPools[i].id.toBase58()].split("_");
        const amountOut = getRate(
          lpPools[i],
          poolInfo,
          MAINNET_SPL_TOKENS[coinTickers[1]],
          MAINNET_SPL_TOKENS[coinTickers[0]],
          1
        );

        const amountOutInvert = getRate(
          lpPools[i],
          poolInfo,
          MAINNET_SPL_TOKENS[coinTickers[0]],
          MAINNET_SPL_TOKENS[coinTickers[1]],
          1
        );

        const poolName = `RAYDIUM_${coinTickers.join("_")}`;

        const results = {
          provider: "RAYDIUM",
          network_fees: 10000,
        };

        const sellResults = {
          ...results,
          rate_raw: amountOut.minAmountOut.invert().toFixed(15),
          from: coinTickers[0],
          rate: parseFloat(amountOut.minAmountOut.invert().toFixed(15)),
          rate_2: parseFloat(amountOutInvert.minAmountOut.toExact()),
          to: coinTickers[1],
        };

        const buyResults = {
          ...results,
          rate_raw: amountOut.minAmountOut.toExact(),
          rate: parseFloat(amountOut.minAmountOut.toExact()),
          rate_2: parseFloat(amountOut.minAmountOut.toExact()),
          from: coinTickers[1],
          to: coinTickers[0],
        };

        const poolResults = {
          buy: {
            ...buyResults,
          },
          sell: {
            ...sellResults,
          },
        };

        console.log(`${poolName}`, amountOut.minAmountOut.currency.decimals);
        console.table([
          {
            route: `${coinTickers[0]} -> ${coinTickers[1]}`,
            rate: sellResults.rate,
            rate_2: sellResults.rate_2,
          },
          {
            route: `${coinTickers[1]} -> ${coinTickers[0]}`,
            rate: buyResults.rate,
            rate_2: buyResults.rate_2
          }
        ])

        // updateDatabase(`${poolName}`, poolResults);
      }
    } catch (e) {
      console.error(e);
    }
    await sleep(400);
  }
})().catch((e) => console.error("FATAL ERROR:", e));
