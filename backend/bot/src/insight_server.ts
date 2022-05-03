import express from 'express';
import cors from "cors";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from "@solana/web3.js";
import { listeners as orcaListeners } from "./common/src/orca-utils/constants";
import { AccountMetaReadonly, jsonInfo2PoolKeys, Liquidity, LiquidityPoolJsonInfo, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { RAYDIUM_POOLS_ENDPOINT, listeners as raydiumListeners } from "./common/src/raydium-utils/constants";
import { OrcaPoolImpl } from "@orca-so/sdk/dist/model/orca/pool/orca-pool";
import { parseLogForPoolInfo, getRaydiumPoolInfoFromLogs, parseMsg } from "./common/src/on-chain-rate-instruction-utils/utils";
import * as RaydiumRateFuncs from "./common/src/raydium-utils/raydium-rate-funcs";
import { MAINNET_SPL_TOKENS } from "./common/src/raydium-utils/tokens";
import { CONNECTION_COMMITMENT, CONNECTION_ENDPOINT_LIST } from './common/src/connection';
import { NATIVE_SOL } from './common/src/raydium-utils/raydium-swap-funcs';
import { Network } from '@orca-so/sdk';
import BN from "bn.js";
import fetch from "node-fetch"
import Decimal from 'decimal.js';
import { getDatabase, onValue, ref } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import config from "./common/src/config";

let ADDITIONAL_SLIPPAGE = 0.005; // modifiable by firebase


const firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_DOMAIN,
    databaseURL: config.FIREBASE_DATABASE_URL,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID
};

const args = process.argv.slice(2);

const firebaseApp = initializeApp(firebaseConfig);
// Get a reference to the database service
const database = getDatabase(firebaseApp);

const mainConnection = new Connection(CONNECTION_ENDPOINT_LIST[0], CONNECTION_COMMITMENT);

const app = express();
const port = args[0] ? parseInt(args[0]) : 4000;

const poolKeysMap = {};
const poolAddrToOrcaPool = {};

orcaListeners.map(([pool, _]) => poolAddrToOrcaPool[pool.address.toBase58()] = pool);

async function main() {
    debugger;
    const lpMetadata = await fetch(RAYDIUM_POOLS_ENDPOINT).then(res => res.json())
    const lpPools: LiquidityPoolJsonInfo[] = [
        ...lpMetadata["official"],
        ...lpMetadata["unOfficial"],
    ].filter((val) => raydiumListeners.includes(val.id));
    
    for (const pool of lpPools) {
        poolKeysMap[pool.id] = jsonInfo2PoolKeys(pool);
    }

    const config_slippage = ref(database, 'configuration/acceptable_slippage');
    onValue( config_slippage, (snapshot) => {
        ADDITIONAL_SLIPPAGE = snapshot.val();
    });
}

main().then(() => console.log("ready")).catch(e => console.error(e))

app.use(cors());

app.get('/api/tx/:txId', (req, res) => {
    const { txId } = req.params;
    const response = {} as any;
    mainConnection.getTransaction(txId, {commitment: "finalized"})
    .then(async parsedTx => {
        let count = 0;
        while (!parsedTx) {
            parsedTx = await mainConnection.getTransaction(txId, {commitment: "finalized"})
            count++;
            if (count > 1000) {
                throw new Error("Transaction not found");
            }
        }
        return parsedTx
    }).then(async parsedTx => {
        debugger;
        console.log("got tx details:", txId);
        const [parsedOrcaAccInfoAndMsg,] = parseLogForPoolInfo(parsedTx.meta.logMessages);
        const status = parseMsg(parsedOrcaAccInfoAndMsg.msg);

        response.parsedTx = parsedTx;
        
        const route = status.route.split(" -> ");
        
        response.route = route;
        response.poolAddrs = status.poolAddrs;
        response.baseToken = status.baseToken;
        response.middleToken = status.middleToken;

        const baseToken = status.baseToken === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[status.baseToken];
        const middleToken = status.middleToken === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[status.middleToken];

        response.baseTokenMint = baseToken.mint;
        response.middleTokenMint = middleToken.mint;


        response.transactionExpectation = {
            startingAmount: status.startingAmount,
            afterFirstSwap: status.afterFirstSwap,
            afterSecondSwap: status.afterSecondSwap,
        };

        const transactionReality = {} as typeof response.transactionExpectation;
        const transactionAltReality = {} as typeof response.transactionExpectation;

        transactionReality.startingAmount = status.startingAmount;
        transactionAltReality.startingAmount = status.startingAmount;

        let alternativeBeforeAmt = status.startingAmount;
        for (const [i, poolId] of route.entries()) {
            let currLogs = parsedTx.meta.logMessages
            const pool_addr = status.poolAddrs[i];
            const [provider, ] = poolId.split("_");
            const fromTokenStr = i == 0 ? status.baseToken : status.middleToken;
            const toTokenStr = i == 0 ? status.middleToken : status.baseToken;
            
            const amountIn = i === 0 ? status.startingAmount : status.afterFirstSwap;
            
            if (provider.split("|")[0] === "RAYDIUM") {
                const [parsedRaydiumAccInfo, nextLogs] = getRaydiumPoolInfoFromLogs(currLogs);
                currLogs = nextLogs;
                const fromToken = fromTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[fromTokenStr];
                const toToken = toTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[toTokenStr];
                
                const poolKeys = poolKeysMap[pool_addr];
                
                const amountOut = RaydiumRateFuncs.getRate(poolKeys, parsedRaydiumAccInfo, fromToken, toToken, amountIn);
                const altAmountOut = RaydiumRateFuncs.getRate(poolKeys, parsedRaydiumAccInfo, fromToken, toToken, alternativeBeforeAmt);

                const parsedAmountOut = (amountOut.amountOut.raw.toNumber() / Math.pow(10, toToken.decimals)) * (1 - ADDITIONAL_SLIPPAGE);
                const parsedAltAmountOut = (altAmountOut.amountOut.raw.toNumber() / Math.pow(10, toToken.decimals)) * (1 - ADDITIONAL_SLIPPAGE);
                
                if (i === 0) {
                    transactionReality.afterFirstSwap = parsedAmountOut;
                    transactionAltReality.afterFirstSwap = parsedAltAmountOut;
                } else if (i === 1) {
                    transactionReality.afterSecondSwap = parsedAmountOut;
                    transactionAltReality.afterSecondSwap = parsedAltAmountOut;;
                }
                
                alternativeBeforeAmt = parsedAltAmountOut;
            } else if (provider.split("|")[0] === "ORCA") {
                const [orcaAccInfo, nextLogs] = parseLogForPoolInfo(currLogs);
                currLogs = nextLogs;

                const poolParam = poolAddrToOrcaPool[pool_addr];
                const currentPool = new OrcaPoolImpl(mainConnection, Network.MAINNET, poolParam)
        
                const coinA = currentPool.getTokenA();
                const coinB = currentPool.getTokenB();
            
                const poolTokens = {
                    [coinA.tag]: coinA,
                    [coinB.tag]: coinB
                }

                const inputAccAmtParsed = orcaAccInfo.inputAcc;
                const outputAccAmtParsed = orcaAccInfo.outputAcc; 

                const fromToken = poolTokens[fromTokenStr];

                const quote = await currentPool.getQuoteWithPoolAmounts(fromToken, new Decimal(amountIn), new BN(inputAccAmtParsed) as any, new BN(outputAccAmtParsed) as any);
                const altQuote = await currentPool.getQuoteWithPoolAmounts(fromToken, new Decimal(alternativeBeforeAmt), new BN(inputAccAmtParsed) as any, new BN(outputAccAmtParsed) as any);
                
                const parsedAmountOut = quote.getExpectedOutputAmount().toNumber() * (1 - ADDITIONAL_SLIPPAGE);
                const parsedAltAmountOut = altQuote.getExpectedOutputAmount().toNumber() * (1 - ADDITIONAL_SLIPPAGE);

                if (i === 0) {
                    transactionReality.afterFirstSwap = parsedAmountOut;
                    transactionAltReality.afterFirstSwap = parsedAltAmountOut;
                } else if (i === 1) {
                    transactionReality.afterSecondSwap = parsedAmountOut;
                    transactionAltReality.afterSecondSwap = parsedAltAmountOut;
                }

                alternativeBeforeAmt = parsedAltAmountOut;
            }
        }
        response.transactionReality = transactionReality;
        response.transactionAltReality = transactionAltReality;
        res.status(200).json(response);
    }).catch(e => {console.error("ERROR_PARSING_TX", e); res.status(500).send(e.message)});
});

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
});
