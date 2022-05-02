import { jsonInfo2PoolKeys, parseSimulateValue } from "@raydium-io/raydium-sdk";
import { MAINNET_SPL_TOKENS } from "./common/src/raydium-utils/tokens";
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
    "id": "DudevotmDLN3KDHA1uTV1AyTYdwGnKUDFEXS9AXLjQ1z",
    "baseMint": "Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1",
    "quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "lpMint": "Pxjdp9tJwouUT4c9UC8Lu6YCYuuvSHmKcFuj1GG8UkR",
    "version": 4,
    "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "authority": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    "openOrders": "3dTC22bCbA6cLr7npckvknxeBuUugqFRj6RP9jhrNHyE",
    "targetOrders": "BEjcspDwC27jthE9Tm8w9oNde9LJUDPJ7znU1k3C9u3q",
    "baseVault": "272j93C1vUfVyHDiC1FrcwM4ogUZasCfgyciUFNJUg9D",
    "quoteVault": "J3SwSfRqHfWbcpHD2UU8VxnsFFpFQpFCxwUW4QUDWUqv",
    "withdrawQueue": "8yXHrkaqExgS7VGHKHmhMiDEdECMdqTVoaWNR1gpwjmS",
    "lpVault": "8JS1E2bBfEdrCMZ6jvCw5KF1xbXP5utuzHocnCGUeGjj",
    "marketVersion": 3,
    "marketProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "marketId": "6qC4GyqzzoLYeye9GKQyJTG4HjRMiq967Z1Jt6Eee8rd",
    "marketAuthority": "41CWKMtDX8FDbuRZCRPmBNEboNWmPkZKePVQy3f2dhRA",
    "marketBaseVault": "9GfyCNoVdnKaZDfC7Bema53NsVDuNxVfwh3F7LXm1hwh",
    "marketQuoteVault": "FvZnJA8vYDLYGYNYxn3rXdPHSUJL3nWmr7kqGUvRpG6x",
    "marketBids": "8Y7vgzDauidz65TbPs9U3aqcjUGEjhFVR172ZggxXSkv",
    "marketAsks": "Yz2HZcXweCw6U4kBeMRcZb1ednJdejrvkBxhw45YPQG",
    "marketEventQueue": "FeEAqsvJTf9dCB2CJsL6YQ5pFeyMyrWxd5VP5YRT58fB"
});


const poolInfo = makePoolInfo(
    JSON.parse(`{"status":1,"coin_decimals":6,"pc_decimals":6,"lp_decimals":6,"pool_pc_amount":130722077,"pool_coin_amount":5921028298,"pool_lp_supply":77540603,"pool_open_time":0,"amm_id":"DudevotmDLN3KDHA1uTV1AyTYdwGnKUDFEXS9AXLjQ1z"}`)
)

const fromTokenStr: string = "USDC";
const toTokenStr: string = "SBR";

const fromToken = fromTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[fromTokenStr];
const toToken = toTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[toTokenStr];


const amountOut = RaydiumRateFuncs.getRate(poolKeys, poolInfo, fromToken, toToken, 5);

console.log(amountOut.amountOut.toFixed(6));