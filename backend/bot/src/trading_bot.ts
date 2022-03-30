import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { jsonInfo2PoolKeys, LiquidityPoolJsonInfo, MAINNET_SPL_TOKENS, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import Decimal from "decimal.js";
import { initializeApp } from 'firebase/app';
import { get, getDatabase, onChildChanged, ref } from "firebase/database";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import { readFile } from "mz/fs";
// ~~~~~~ firebase configs ~~~~~~
import config from "./common/src/config";
import { CONNECTION_COMMITMENT, CONNECTION_ENDPOINT_LIST, useConnection } from "./common/src/connection";
import { swap as orcaSwap } from "./orca-swap-funcs";
import { NATIVE_SOL, swap as raydiumSwap } from "./raydium-swap-funcs";
import { createAssociatedTokenAccountIfNotExist } from "./raydium-utils/web3";
import fetch from "node-fetch"

const firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_DOMAIN,
    databaseURL: config.FIREBASE_DATABASE_URL,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
// Get a reference to the database service
const database = getDatabase(app);
const firestore = getFirestore(app);
// ~~~~~~ firebase configs ~~~~~~

const WALLET_KEY_PATH = process.env.WALLET_KEY_PATH ?? "/Users/noelb/my-solana-wallet/wallet-keypair.json"
const SLIPPAGE = 0.08;
const THRESHOLD = 0;
const STARTING_USDC_BET = 4

let ready_to_trade = true;  // flag to look for updates only when a swap intruction is done

// SOL_USDC Raydium token
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const RAYDIUM_POOLS_ENDPOINT = "https://sdk.raydium.io/liquidity/mainnet.json"

let connection = new Connection(CONNECTION_ENDPOINT_LIST[CONNECTION_ENDPOINT_LIST.length - 1], CONNECTION_COMMITMENT)

const orca = getOrca(connection);
const poolKeysMap = {};
let owner: Keypair;

let local_database: any = {};

// function to set up local copy of the database
async function query_pools() {
    const latest_price = ref(database, 'latest_prices/');
    return get(latest_price).then((snapshot) => {
        if (!snapshot.exists()) throw new Error("Snapshot doesn't exist");
        return snapshot.val();
    })
}

async function main() {
    // ==== Setup 
    // Read secret key file to get owner keypair
    const secretKeyString = await readFile(WALLET_KEY_PATH, {
        encoding: "utf8",
    });

    const lpMetadata = await fetch(RAYDIUM_POOLS_ENDPOINT).then(res => res.json())
    const allOfficialLpPools: LiquidityPoolJsonInfo[] = lpMetadata["official"];
    for (const pool of allOfficialLpPools) {
        poolKeysMap[`${pool.baseMint}-${pool.quoteMint}`] = jsonInfo2PoolKeys(pool);
    }

    // local_database setup
    const queries = await query_pools();
    console.log("local_database setup");
    local_database = queries;
    let middleTokenToPoolMap = getMiddleTokenToPoolMap("USDC");


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
        const promises = [];
        ready_to_trade = false;
        for (const middleTokenName of Object.keys(middleTokenToRouteMap)) {
            if (middleTokenToRouteMap[middleTokenName].length > 0) {
                promises.push(calculate_trade(middleTokenToRouteMap[middleTokenName][0]));
            }
        }
        Promise.all(promises)
            .then(() => {
                ready_to_trade = true;
            })
            .catch(e => console.error(e))
    }
    
    // initial trade calculation
    loop();

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
        if (ready_to_trade) {
            loop();
            console.log("going to check new change")
        }

    });
}

main().then(() => {}).catch(e => console.error(e))

async function calculate_trade({route, estimatedProfit}) {
    // console.log(local_database, update)
    let usdc = STARTING_USDC_BET;

    console.log([
        {pool_id: route[0].pool_id, from: route[0].buy.from, to: route[0].buy.to},
        {pool_id: route[1].pool_id, from: route[1].sell.from, to: route[1].sell.to}
    ], {estimatedProfit});

    if (estimatedProfit > THRESHOLD) {
        await arbitrage(route, usdc, usdc + (usdc * estimatedProfit))
    }
}


// 1st set up local database
// update database on changes, if change is found, calculate the rate differences to check for profitable trades
// if profitable trade exists, conduct a swap.
// only after a swap is done, look for another database update?

const arbitrage = async (route, fromCoinAmount, _expected_usdc) => {
    console.log( { fromCoinAmount, _expected_usdc })    

    let transactionId = "";

    const tokenAccounts = await getTokenAccounts();
    const transaction = new Transaction();
    transaction.feePayer = owner.publicKey;
    const signers = [];

    let beforeAmt = fromCoinAmount;

    for (const [i, pool] of route.entries()) {
        const newTokenAmt = beforeAmt * 
            (i === 0 ? pool.buy.rate : pool.sell.rate) * (1 - SLIPPAGE);

        const fromTokenStr = (i === 0 ? pool.buy.from : pool.sell.from);
        const toTokenStr = (i === 0 ? pool.buy.to : pool.sell.to);

        if (pool.pool_id.split("_")[0] === "RAYDIUM") {
            const fromToken = fromTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[fromTokenStr];
            const toToken = toTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[toTokenStr];

            const res = await raydiumSwap(
                connection,
                owner,
                poolKeysMap[`${fromToken.mint}-${toToken.mint}`] ?? poolKeysMap[`${toToken.mint}-${fromToken.mint}`],
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
        } else if (pool.pool_id.split("_")[0] === "ORCA") {
            const orcaAmmPool = orca.getPool(OrcaPoolConfig[pool.pool_id.split("_").slice(1).join("_")]);
            const poolTokens = {
                [orcaAmmPool.getTokenA().tag]: orcaAmmPool.getTokenA(),
                [orcaAmmPool.getTokenB().tag]: orcaAmmPool.getTokenB()
            }

            
            const fromToken = poolTokens[fromTokenStr];
            const toToken = poolTokens[toTokenStr];
            // orcaAmmPool.getQuote(fromToken, new Decimal(beforeAmt), new Decimal(1 / SLIPPAGE)).then(q => {
            //     const actualNewTokenAmt = q.getExpectedOutputAmount().toNumber();
            //     console.log({beforeAmt, newTokenAmt, actualNewTokenAmt, actualRate: q.getRate().toNumber(), expectedRate: (i === 0 ? pool.buy.rate : pool.sell.rate)});
            // })
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

        beforeAmt = newTokenAmt;
    }

    const beforeParsedInfo = tokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint]?.parsedInfo;
    const beforeUSDC = parseFloat(beforeParsedInfo.tokenAmount.uiAmount);

    try {
        transactionId = await sendAndConfirmTransaction(connection, transaction, signers, {commitment: "singleGossip", skipPreflight: true});
        console.log({ transactionId });

        // Repoll for token account data
        const afterTokenAccounts = await getTokenAccounts();
        if (!afterTokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint])
            throw new Error("No USDC token account!");

        const parsedInfo = afterTokenAccounts[MAINNET_SPL_TOKENS["USDC"].mint]?.parsedInfo;
        const afterUSDC = parseFloat(parsedInfo.tokenAmount.uiAmount);
        
        write_to_database(beforeUSDC, afterUSDC, _expected_usdc, transactionId);
    } catch (err) {
        console.error(err);
    }
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
                    "a then b": ((1 * a.buy.rate * (1 - SLIPPAGE)) * b.sell.rate * (1 - SLIPPAGE)) - 1,
                    "b then a": ((1 * b.buy.rate * (1 - SLIPPAGE)) * a.sell.rate * (1 - SLIPPAGE)) - 1
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