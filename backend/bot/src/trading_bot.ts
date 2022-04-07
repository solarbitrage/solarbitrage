import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { jsonInfo2PoolKeys, Liquidity, LiquidityPoolJsonInfo, MAINNET_SPL_TOKENS, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import Decimal from "decimal.js";
import { initializeApp } from 'firebase/app';
import { get, getDatabase, onChildChanged, ref, set } from "firebase/database";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import { readFile } from "mz/fs";
import fetch from "node-fetch";
// ~~~~~~ firebase configs ~~~~~~
import config from "./common/src/config";
import { useConnection } from "./common/src/connection";
import { swap as orcaSwap } from "./common/src/orca-utils/orca-swap-funcs";
import * as RaydiumRateFuncs from "./common/src/raydium-utils/raydium-rate-funcs";
import { NATIVE_SOL, swap as raydiumSwap } from "./common/src/raydium-utils/raydium-swap-funcs";
import { createAssociatedTokenAccountIfNotExist } from "./common/src/raydium-utils/web3";
import { RAYDIUM_POOLS_ENDPOINT, listeners } from "./common/src/raydium-utils/constants";

const firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_DOMAIN,
    databaseURL: config.FIREBASE_DATABASE_URL,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID
};

// Hot patches to token info
MAINNET_SPL_TOKENS["SOL"] = {
    ...WSOL,
};

MAINNET_SPL_TOKENS["ETH"] = {
    ...MAINNET_SPL_TOKENS["ETH"],
    mint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    name: "Ether (Portal)", // TODO: fix ETH-USDC pool
    decimals: 8
}

const app = initializeApp(firebaseConfig);
// Get a reference to the database service
const database = getDatabase(app);
const firestore = getFirestore(app);
// ~~~~~~ firebase configs ~~~~~~

const WALLET_KEY_PATH = process.env.WALLET_KEY_PATH ?? "/Users/noelb/my-solana-wallet/wallet-keypair.json"
const STARTING_SLIPPAGE = 0;
const ADDITIONAL_SLIPPAGE = 0.01;
const THRESHOLD = 0;
const STARTING_USDC_BET = 4

let ready_to_trade = true;  // flag to look for updates only when a swap intruction is done

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

const getNewConnection = useConnection(false);
let connection = getNewConnection();

const poolKeysMap = {};
let owner: Keypair;

let local_database: any = {};
let pool_to_slippage_map: {[key:string]: [number, number]} = {};

// function to set up local copy of the database
async function query_pools() {
    const latest_price = ref(database, 'latest_prices/');
    return get(latest_price).then((snapshot) => {
        if (!snapshot.exists()) throw new Error("Snapshot doesn't exist");
        return snapshot.val();
    })
}

async function get_slippages() {
    const slip_map = ref(database, 'mainnet_pool_to_slippage_map/');
    return get(slip_map).then((snapshot) => {
        if (!snapshot.exists()) return {};
        const data = snapshot.val();
        const ret = {}
        for (const key of Object.keys(data)) {
            ret[key] = [data[key]["0"], data[key]["1"]]
        }
        return ret;
    })
}

async function set_slippages(val) {
    const slip_map = ref(database, 'mainnet_pool_to_slippage_map/');
    return set(slip_map, val);
}

async function main() {
    // ==== Setup 
    // Read secret key file to get owner keypair
    const secretKeyString = await readFile(WALLET_KEY_PATH, {
        encoding: "utf8",
    });

    const lpMetadata = await fetch(RAYDIUM_POOLS_ENDPOINT).then(res => res.json())
    const lpPools: LiquidityPoolJsonInfo[] = [
        ...lpMetadata["official"],
        ...lpMetadata["unOfficial"],
    ].filter((val) => listeners.includes(val.id));
    
    for (const pool of lpPools) {
        const baseMint = pool.baseMint === WSOL.mint ? NATIVE_SOL.mint : pool.baseMint;
        const quoteMint = pool.quoteMint === WSOL.mint ? NATIVE_SOL.mint : pool.quoteMint;
        poolKeysMap[`${baseMint}-${quoteMint}`] = jsonInfo2PoolKeys(pool);
    }

    // local_database setup
    const queries = await query_pools();
    console.log("local_database setup");
    local_database = queries;
    let middleTokenToPoolMap = getMiddleTokenToPoolMap("USDC");

    // setup slippage's per pool_id
    pool_to_slippage_map = await get_slippages();
    for (const poolId of Object.keys(local_database)) {
        if (!pool_to_slippage_map[poolId]) {
            pool_to_slippage_map[poolId] = [STARTING_SLIPPAGE, STARTING_SLIPPAGE];
        }
    }

    // get wallet credentials
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    owner = Keypair.fromSecretKey(secretKey);
    console.log("wallet creds");

    // setup token account
    await setupTokenAccounts(Object.keys(middleTokenToPoolMap));
    console.log("setup WSOL Token Account");

    const loop = () => {
        middleTokenToPoolMap = getMiddleTokenToPoolMap("USDC");
        const middleTokenToRouteMap = getMiddleTokenToRoutesMap(middleTokenToPoolMap);
        const profitableRoutes = []
        ready_to_trade = false;

        set_slippages(pool_to_slippage_map);

        for (const middleTokenName of Object.keys(middleTokenToRouteMap)) {
            if (middleTokenToRouteMap[middleTokenName].length > 0) {
                profitableRoutes.push(middleTokenToRouteMap[middleTokenName][0])
            }
        }

        console.table(
            Object.keys(pool_to_slippage_map)
                .map(poolId => ({ "Pool": poolId, "Buy Rate Slippage (%)": (pool_to_slippage_map[poolId][0] * 100).toFixed(4), "Sell Rate Slippage (%)": (pool_to_slippage_map[poolId][0] * 100).toFixed(4) }))
        )


        console.table(profitableRoutes
            .sort((a, b) => b.estimatedProfit - a.estimatedProfit)
            .map(r => ({
                "Estimated Profit per $1": r.estimatedProfit,
                "First Pool": r.route[0].pool_id,
                "Second Pool": r.route[1].pool_id
            })));


        return Promise.all(profitableRoutes.sort((a, b) => b.estimatedProfit - a.estimatedProfit).map((r, i) => calculate_trade(r, i)))
            .then(() => {
                ready_to_trade = true;
            })
            .catch(e => console.error(e))
    }
    

    // ==== Start listener
    const updated_pools = ref(database, 'latest_prices/');
    onChildChanged(updated_pools, (snapshot) => {
        // console.log("snapshot", snapshot)
        //  console.log("key", snapshot.key)
        const data = snapshot.val();
        local_database[snapshot.key] = data;

        //function that runs caclculations anytime there's a change
        // while(!ready_to_trade){

        // }

    });

    for (;;) {
        const dateString = new Date().toLocaleString()
        console.log(dateString, "-".repeat(Math.max(process.stdout.columns - dateString.length - 1, 0)))
        await loop();
        await new Promise<void>((res) => setTimeout(() => res(), 300));
    }
}

main().then(() => {}).catch(e => {console.error(e); process.exit(1)})

async function calculate_trade({route, estimatedProfit}, index) {
    let usdc = STARTING_USDC_BET;
    // don't bother if it is not the top 4 routes
    if (estimatedProfit <= THRESHOLD && index >= 3) return;

    // if the route is not profitable then don't make swap functions, just test out slippage
    await arbitrage(route, usdc, usdc + (usdc * estimatedProfit), estimatedProfit <= THRESHOLD)
}


// 1st set up local database
// update database on changes, if change is found, calculate the rate differences to check for profitable trades
// if profitable trade exists, conduct a swap.
// only after a swap is done, look for another database update?
const arbitrage = async (route, fromCoinAmount: number, _expected_usdc, shouldSkipSwap?: boolean) => {
    const current_pool_to_slippage = JSON.parse(JSON.stringify(pool_to_slippage_map))
    let transactionId = "";

    const tokenAccounts = await getTokenAccounts();
    const transaction = new Transaction();
    transaction.feePayer = owner.publicKey;
    const signers = [];

    const afterSwapPromises = [];

    let beforeAmt = fromCoinAmount;
    try {
        for (const [i, pool] of route.entries()) {
            const pool_id = pool.pool_id;
            const slippage = current_pool_to_slippage[pool_id][i];
            const newTokenAmt = beforeAmt * 
                (i === 0 ? pool.buy.rate : pool.sell.rate) * (1 - slippage);

            const fromTokenStr = (i === 0 ? pool.buy.from : pool.sell.from);
            const toTokenStr = (i === 0 ? pool.buy.to : pool.sell.to);

            if (pool_id.split("_")[0] === "RAYDIUM") {
                const fromToken = fromTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[fromTokenStr];
                const toToken = toTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[toTokenStr];

                const poolKeys = poolKeysMap[`${fromToken.mint}-${toToken.mint}`] ?? poolKeysMap[`${toToken.mint}-${fromToken.mint}`];

                // check if rates are accurately (without affecting swap call)
                const _beforeAmt = beforeAmt;     
                const _i = i;      
                const _pool_id = pool.pool_id;         
                afterSwapPromises.push((async () => {
                    const connection = getNewConnection();
                    // im sorry
                    const _fromToken = fromToken.mint === NATIVE_SOL.mint ? WSOL : fromToken;
                    const _toToken = toToken.mint === NATIVE_SOL.mint ? WSOL : toToken;

                    const amountOut = RaydiumRateFuncs.getRate(poolKeys, await Liquidity.fetchInfo({ connection, poolKeys }), _fromToken, _toToken, _beforeAmt)
                    const parsedAmountOut = (amountOut.amountOut.raw.toNumber() / Math.pow(10, toToken.decimals)) * (1 - ADDITIONAL_SLIPPAGE);

                    if (
                        parsedAmountOut < newTokenAmt &&
                        (_i != 0 || 
                        parsedAmountOut * route[_i+1].sell.rate < newTokenAmt * route[_i+1].sell.rate)
                    ) {
                        const slippageShouldBe = slippage + (1 - parsedAmountOut / newTokenAmt)
                        // console.warn(`POOL_ID{${pool.pool_id}}[${_i}]: SLIPPAGE_WARNING: ${parsedAmountOut} < ${newTokenAmt} which results in a unprofitable trade (trading on RAYDIUM, slippage should maybe be ${slippageShouldBe})`);
                        pool_to_slippage_map[_pool_id][_i] = slippageShouldBe; 
                    } else if (parsedAmountOut > newTokenAmt) {
                        const slippageShouldBe = slippage + (1 - parsedAmountOut / newTokenAmt)
                        // console.warn(`POOL_ID{${pool.pool_id}}[${_i}]: SLIPPAGE_WARNING: ${parsedAmountOut} > ${newTokenAmt} which means slippage might be too high (trading on RAYDIUM, slippage should maybe be ${slippageShouldBe})`);
                        pool_to_slippage_map[_pool_id][_i] = slippageShouldBe; 
                    }
                })().catch((e: Error) => {console.error(`POOL_ID{${_pool_id}}[${_i}]:`,e)}))

                const connection = getNewConnection();
                if (!shouldSkipSwap) {
                    const res = await raydiumSwap(
                        connection,
                        owner,
                        poolKeys,
                        fromToken,
                        toToken,
                        tokenAccounts[fromToken.mint]?.tokenAccountAddress,
                        tokenAccounts[toToken.mint]?.tokenAccountAddress,
                        beforeAmt.toString(),
                        newTokenAmt.toString(),
                        tokenAccounts[WSOL.mint]?.tokenAccountAddress
                    );
                    transaction.add(res.transaction);
                    signers.push(...res.signers);
                }
            } else if (pool_id.split("_")[0] === "ORCA") {
                const connection = getNewConnection();
                const orca = getOrca(connection);
                const orcaAmmPool = orca.getPool(OrcaPoolConfig[pool.pool_id.split("_").slice(1).join("_")]);
                const poolTokens = {
                    [orcaAmmPool.getTokenA().tag]: orcaAmmPool.getTokenA(),
                    [orcaAmmPool.getTokenB().tag]: orcaAmmPool.getTokenB()
                }


                const fromToken = poolTokens[fromTokenStr];
                const toToken = poolTokens[toTokenStr];

                // check if rates are accurately (without affecting swap call)
                const _beforeAmt = beforeAmt;     
                const _i = i;      
                const _pool_id = pool.pool_id;   

                afterSwapPromises.push((async () => { 
                    // the things we do for pooling connections
                    const connection = getNewConnection();
                    const orca = getOrca(connection);
                    const orcaAmmPool = orca.getPool(OrcaPoolConfig[_pool_id.split("_").slice(1).join("_")]);

                    const quote = await orcaAmmPool.getQuote(fromToken, new Decimal(_beforeAmt))
                    const parsedAmountOut = quote.getExpectedOutputAmount().toNumber() * (1 - ADDITIONAL_SLIPPAGE);
                                        
                    if (
                        parsedAmountOut < newTokenAmt &&
                        (_i != 0 || 
                        parsedAmountOut * route[_i+1].sell.rate < newTokenAmt * route[_i+1].sell.rate)
                    ) {
                        const slippageShouldBe = slippage + (1 - parsedAmountOut / newTokenAmt)
                        // console.warn(`POOL_ID{${pool.pool_id}}[${_i}]: SLIPPAGE_WARNING: ${parsedAmountOut} < ${newTokenAmt} which results in a unprofitable trade (trading on ORCA, slippage should maybe be ${slippageShouldBe})`);
                        pool_to_slippage_map[_pool_id][_i] = slippageShouldBe; 
                    } else if (parsedAmountOut > newTokenAmt) {
                        const slippageShouldBe = slippage + (1 - parsedAmountOut / newTokenAmt)
                        // console.warn(`POOL_ID{${pool.pool_id}}[${_i}]: SLIPPAGE_WARNING: ${parsedAmountOut} > ${newTokenAmt} which means slippage might be too high (trading on ORCA, slippage should maybe be ${slippageShouldBe})`);
                        pool_to_slippage_map[_pool_id][_i] = slippageShouldBe; 
                    }
                })().catch((e: Error) => {console.error(`POOL_ID{${_pool_id}}[${_i}]:`,e.message)}))

                if (!shouldSkipSwap) {
                    const { transactionPayload } = await orcaSwap(
                        orcaAmmPool, 
                        owner, 
                        fromToken, 
                        new Decimal(beforeAmt), 
                        new Decimal(newTokenAmt), 
                        new PublicKey(tokenAccounts[fromToken.mint.toBase58()]?.tokenAccountAddress),
                        new PublicKey(tokenAccounts[toToken.mint.toBase58()]?.tokenAccountAddress),
                    );
                    transaction.add(transactionPayload.transaction);
                    signers.push(...transactionPayload.signers); 
                }

            }

            beforeAmt = newTokenAmt;
        }

        if (!shouldSkipSwap) {
            const beforeParsedInfo = tokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint]?.parsedInfo;
            const beforeUSDC = parseFloat(beforeParsedInfo.tokenAmount.uiAmount);

            const connection = getNewConnection();
            transactionId = await sendAndConfirmTransaction(connection, transaction, signers, {commitment: "singleGossip", skipPreflight: true});
            console.log({ transactionId });

            // Repoll for token account data
            const afterTokenAccounts = await getTokenAccounts();
            if (!afterTokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint])
                throw new Error("No USDC token account!");

            const parsedInfo = afterTokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint]?.parsedInfo;
            const afterUSDC = parseFloat(parsedInfo.tokenAmount.uiAmount);
            
            write_to_database(beforeUSDC, afterUSDC, _expected_usdc, transactionId);
        }

    } catch (err) {
        console.error(`CONTEXT: ${route[0].pool_id} -> ${route[1].pool_id}\n`, err);
    }
    await Promise.allSettled(afterSwapPromises);
}


function getMiddleTokenToPoolMap(mainToken: string) {
    const poolsWithUSDC = Object.keys(local_database)
        .filter(amm => amm.includes("_" +mainToken))
        .map(pool => ({...local_database[pool], pool_id: pool, tokens: pool.split("_").slice(1)}));

    const mapFromMiddleTokenToPool = {};
    for (const pool of poolsWithUSDC) {
        let middleTokenName = ""
        for (const t of pool.tokens) {
            if (t !== "UDSC") {
                middleTokenName = t;
                break;
            }
        }
        if (!(middleTokenName in mapFromMiddleTokenToPool)) {
            mapFromMiddleTokenToPool[middleTokenName] = []
        }

        mapFromMiddleTokenToPool[middleTokenName].push(pool);
    }

    return mapFromMiddleTokenToPool;
}

function getMiddleTokenToRoutesMap(middleTokenToPoolMap: any) {
    const middleTokenToRouteMap = {};

    for (const middleTokenName of Object.keys(middleTokenToPoolMap)) {
        if (!(middleTokenName in middleTokenToRouteMap)) {
            middleTokenToRouteMap[middleTokenName] = []
        }
        for (let x=0; x<middleTokenToPoolMap[middleTokenName].length; x++) {
            for (let y=x+1; y<middleTokenToPoolMap[middleTokenName].length; y++) {
                const a = middleTokenToPoolMap[middleTokenName][x];
                const b = middleTokenToPoolMap[middleTokenName][y];

                let estimatedProfits = {
                    "a then b": ((1 * a.buy.rate * (1 - pool_to_slippage_map[a.pool_id][0])) * b.sell.rate * (1 - pool_to_slippage_map[b.pool_id][1])) - 1,
                    "b then a": ((1 * b.buy.rate * (1 - pool_to_slippage_map[b.pool_id][0])) * a.sell.rate * (1 - pool_to_slippage_map[a.pool_id][1])) - 1
                }

                if (estimatedProfits["a then b"] > estimatedProfits["b then a"]) {
                    middleTokenToRouteMap[middleTokenName].push({route: [a, b], estimatedProfit: estimatedProfits["a then b"]})
                } else {
                    middleTokenToRouteMap[middleTokenName].push({route: [b, a], estimatedProfit: estimatedProfits["b then a"]})
                }   
            }
        }

        middleTokenToRouteMap[middleTokenName].sort((a, b) => b.estimatedProfit - a.estimatedProfit);
    }

    return middleTokenToRouteMap;
}

// write to firestore
async function write_to_database(_start: number, _end: number, _expected_profit: number, _transaction_id: string) {
    try {
        const docRef = await addDoc(collection(firestore, "trade_history"), {
            starting_amount: _start,
            ending_amount: _end,
            net_profit: (_end - _start),
            expected_profit: _expected_profit,
            transaction_id: _transaction_id,
            time_stamp: serverTimestamp()
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function getTokenAccounts() {
    const accounts = await connection.getParsedTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID })

    // token account for Raydium
    const tokenAccounts = {};
    for (const tokenAccountInfo of accounts.value) {
        const tokenAccountPubkey = tokenAccountInfo.pubkey
        const tokenAccountAddress = tokenAccountPubkey.toBase58()
        const parsedInfo = tokenAccountInfo.account.data.parsed.info
        const mintAddress = parsedInfo.mint
        const balance = new TokenAmount(parsedInfo.tokenAmount.amount, parsedInfo.tokenAmount.decimals)

        tokenAccounts[mintAddress] = {
            tokenAccountAddress,
            balance,
            parsedInfo
        }
    }

    return tokenAccounts;
}

async function setupTokenAccounts(tokens: string[]) {
    const tokenAccounts = await getTokenAccounts();

    let transaction = new Transaction();
    let signers = [];

    signers.push(owner);

    for (let [i, token] of tokens.entries()) {
        if (token === "SOL") {
            token = "WSOL";
        }
        if (!tokenAccounts[MAINNET_SPL_TOKENS[token].mint]) {  
            console.log("creating token acc for", token)         
            await createAssociatedTokenAccountIfNotExist(
                null,
                owner.publicKey,
                MAINNET_SPL_TOKENS[token].mint,
                transaction
            )
        }

        if ((i+1) % 3 && transaction.instructions.length > 0) {
            const tx = await sendAndConfirmTransaction(connection, transaction, signers, { commitment: "singleGossip" });
            transaction = new Transaction();
            signers = [owner];
            console.log("create token acc: ", tx)
        }
        
    }
    
    if (transaction.instructions.length > 0) {
        const tx = await sendAndConfirmTransaction(connection, transaction, signers, { commitment: "singleGossip" });
        console.log("create token acc: ", tx)    
    }
}