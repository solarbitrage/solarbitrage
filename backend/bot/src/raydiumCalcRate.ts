import { jsonInfo2PoolKeys, MAINNET_SPL_TOKENS, parseSimulateValue } from "@raydium-io/raydium-sdk";
import { BN } from "bn.js"
import * as RaydiumRateFuncs from "./common/src/raydium-utils/raydium-rate-funcs";
import { NATIVE_SOL } from "./common/src/raydium-utils/raydium-swap-funcs";

const makePoolInfo = (json: any) => {
    const status = new BN(json.status);
    const baseDecimals = Number(json.coin_decimals);
    const quoteDecimals = Number(json.pc_decimals);
    const lpDecimals = Number(json.lp_decimals);
    const baseReserve = new BN(json.pool_coin_amount);
    const quoteReserve = new BN(json.pool_pc_amount);
    const lpSupply = new BN(json.pool_lp_supply);

    return {
        status,
        baseDecimals,
        quoteDecimals,
        lpDecimals,
        baseReserve,
        quoteReserve,
        lpSupply,
    };
}

const poolKeys = jsonInfo2PoolKeys({
    "id": "7XXKU8oGDbeGrkPyK5yHKzdsrMJtB7J2TMugjbrXEhB5",
    "baseMint": "SLRSSpSLUTP7okbCUBYStWCo1vUgyt775faPqz8HUMr",
    "quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "lpMint": "2Xxbm1hdv5wPeen5ponDSMT3VqhGMTQ7mH9stNXm9shU",
    "version": 4,
    "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "authority": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    "openOrders": "3wNRVMaot3R2piZkzmKsAqewcZ5ABktqrJZrc4Vz3uWs",
    "targetOrders": "BwSmQF7nxRqzzVdfaynxM98dNbXFi94cemDDtxMfV3SB",
    "baseVault": "6vjnbp6vhw4RxNqN3e2tfE3VnkbCx8RCLt8RBmHZvuoC",
    "quoteVault": "2anKifuiizorX69zWQddupMqawGfk3TMPGZs4t7ZZk43",
    "withdrawQueue": "Fh5WTfP9jCbkLPzsspCs4WCSPGqE5GYE8v7kqFXijMSA",
    "lpVault": "9oiniKrJ7r1cHw97gv4XPxTFS9i61vSa7PkpRcm8qGeK",
    "marketVersion": 3,
    "marketProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "marketId": "2Gx3UfV831BAh8uQv1FKSPKS9yajfeeD8GJ4ZNb2o2YP",
    "marketAuthority": "CjiJdQ9a7dnjTKfVPZ2fwn31NtgJA1kRU55pwDE8HHrM",
    "marketBaseVault": "6B527pfkvbvbLRDgjASLGygdaQ1fFLwmmqyFCgTacsKH",
    "marketQuoteVault": "Bsa11vdveUhSouxAXSYCE4yXToUP58N9EEeM1P8qbtp3",
    "marketBids": "6kMW5vafM4mWZJdBNpH4EsVjFSuSTUokx5meYoVY8GTw",
    "marketAsks": "D5asu2BVatxtgGFugwmNubdknAsLSJDZcqRHvkaS8UBd",
    "marketEventQueue": "66Go3JcjNJaDHHvJyaFaV8rh8GAciLzvM8WzN7fRE3HM"
});


const poolInfo = makePoolInfo(
    JSON.parse(`{"status":1,"coin_decimals":6,"pc_decimals":6,"lp_decimals":6,"pool_pc_amount":29417075622,"pool_coin_amount":251405031343,"pool_lp_supply":361372971145,"pool_open_time":0,"amm_id":"7XXKU8oGDbeGrkPyK5yHKzdsrMJtB7J2TMugjbrXEhB5"}`)
)

const fromTokenStr: string = "SLRS";
const toTokenStr: string = "USDC";

const fromToken = fromTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[fromTokenStr];
const toToken = toTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[toTokenStr];


const amountOut = RaydiumRateFuncs.getRate(poolKeys, poolInfo, fromToken, toToken, 34.21);

console.log(amountOut.amountOut.toFixed(6));