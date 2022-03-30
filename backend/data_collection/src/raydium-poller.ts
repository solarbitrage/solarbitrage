import { Connection } from "@solana/web3.js";
import fetch from "node-fetch"
import { Liquidity, LiquidityPoolJsonInfo, jsonInfo2PoolKeys } from "@raydium-io/raydium-sdk";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

import config from "./common/src/config";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const sleep = (ms: number) => new Promise((res) => setTimeout(res,ms));

// Connection info

const getNextConnection = useConnection();

const RAYDIUM_POOLS_ENDPOINT = "https://sdk.raydium.io/liquidity/mainnet.json"

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
  return set(ref(database, 'latest_prices/' + poolName), data);
}

(async () => {
  const lpMetadata = await fetch(RAYDIUM_POOLS_ENDPOINT).then(res => res.json())
  const allOfficialLpPools: LiquidityPoolJsonInfo[] = lpMetadata["official"];
  const lpPools = allOfficialLpPools.filter((val) => listeners.includes(val.id)).map(p => jsonInfo2PoolKeys(p))

  for (;;) {
    const connection = getNextConnection();
    const poolInfos = await Liquidity.fetchMultipleInfo({ connection, pools: lpPools })
    for (const [i, poolInfo] of poolInfos.entries()) {
      try {
        const price = Liquidity.getRate(poolInfo);
        const coinTickers = poolMintAddrToName[lpPools[i].id.toBase58()].split("_")
        const poolName = `RAYDIUM_${coinTickers.join("_")}`;
        
        const results = {
          provider: "RAYDIUM",
          network_fees: 10000,
        }
        
        const sellResults = {
          ...results,
          rate: parseFloat(price.toFixed(15)),
          rate_raw: price.toFixed(15),
          from: coinTickers[0],
          to: coinTickers[1],
        }
        
        const buyResults = {
          ...results,
          rate: parseFloat(price.invert().toFixed(15)),
          rate_raw: price.invert().toFixed(15),
          from: coinTickers[1],
          to: coinTickers[0],
        }

        const poolResults = {
          buy: {
            ...buyResults
          },
          sell: {
            ...sellResults
          }
        }
        
        console.log(`${poolName}`, poolResults)
        
        updateDatabase(`${poolName}`, poolResults)
      } catch(e) {
        console.error(e);
      }
    }
    await sleep(400)
  }

})().catch((e) => console.error(e));
