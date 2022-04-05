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

const RAYDIUM_POOLS_ENDPOINT = "https://sdk.raydium.io/liquidity/mainnet.json";

const listeners = [
  "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2", // SOL-USDC
  "EoNrn8iUhwgJySD1pHu8Qxm5gSQqLK3za4m8xzD2RuEb", // ETH-USDC
  "C5yXRTp39qv5WZrfiqoqeyK6wvbqS97oBqbsDUqfZyu", // ORCA-USDC
  "33dWwj33J3NUzoTmkMAUq1VdXZL89qezxkdaHdN88vK2", // LIQ-USDC
  "5TgJXpv6H3KJhHCuP7KoDLSCmi8sM8nABizP7CmYAKm1", // SNY-USDC
  "ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix", // mSOL-USDC
  "7XXKU8oGDbeGrkPyK5yHKzdsrMJtB7J2TMugjbrXEhB5", // SLRS-USDC
  "6nJes56KF999Q8VtQTrgWEHJGAfGMuJktGb8x2uWff2u", // PORT-USDC
  "DudevotmDLN3KDHA1uTV1AyTYdwGnKUDFEXS9AXLjQ1z", // SBR-USDC
  "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg", // RAY-USDC
];

const poolMintAddrToName = {
  "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2": "SOL_USDC",
  "EoNrn8iUhwgJySD1pHu8Qxm5gSQqLK3za4m8xzD2RuEb": "ETH_USDC",
  "C5yXRTp39qv5WZrfiqoqeyK6wvbqS97oBqbsDUqfZyu": "ORCA_USDC",
  "33dWwj33J3NUzoTmkMAUq1VdXZL89qezxkdaHdN88vK2": "LIQ_USDC",
  "5TgJXpv6H3KJhHCuP7KoDLSCmi8sM8nABizP7CmYAKm1": "SNY_USDC",
  "ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix": "mSOL_USDC",
  "7XXKU8oGDbeGrkPyK5yHKzdsrMJtB7J2TMugjbrXEhB5": "SLRS_USDC",
  "6nJes56KF999Q8VtQTrgWEHJGAfGMuJktGb8x2uWff2u": "PORT_USDC",
  "DudevotmDLN3KDHA1uTV1AyTYdwGnKUDFEXS9AXLjQ1z": "SBR_USDC",
  "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg": "RAY_USDC",
};

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
          to: coinTickers[1],
        };

        const buyResults = {
          ...results,
          rate_raw: amountOut.minAmountOut.toExact(),
          rate: parseFloat(amountOut.minAmountOut.toExact()),
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
            rate: sellResults.rate
          },
          {
            route: `${coinTickers[1]} -> ${coinTickers[0]}`,
            rate: buyResults.rate
          }
        ])

        updateDatabase(`${poolName}`, poolResults);
      }
    } catch (e) {
      console.error(e);
    }
    await sleep(400);
  }
})().catch((e) => console.error("FATAL ERROR:", e));
