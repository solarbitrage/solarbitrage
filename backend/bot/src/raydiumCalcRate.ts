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
    "id": "ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix",
    "baseMint": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    "quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "lpMint": "4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf",
    "version": 4,
    "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "authority": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    "openOrders": "4zoatXFjMSirW2niUNhekxqeEZujjC1oioKCEJQMLeWF",
    "targetOrders": "Kq9Vgb8ntBzZy5doEER2p4Zpt8SqW2GqJgY5BgWRjDn",
    "baseVault": "8JUjWjAyXTMB4ZXcV7nk3p6Gg1fWAAoSck7xekuyADKL",
    "quoteVault": "DaXyxj42ZDrp3mjrL9pYjPNyBp5P8A2f37am4Kd4EyrK",
    "withdrawQueue": "CfjpUvQAoU4hadb9nReTCAqBFFP7MpJyBW97ezbiWgsQ",
    "lpVault": "3EdqPYv3hLJFXC3U9LH7yA7HX6Z7gRxT7vGQQJrxScDH",
    "marketVersion": 3,
    "marketProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "marketId": "6oGsL2puUgySccKzn9XA9afqF217LfxP5ocq4B3LWsjy",
    "marketAuthority": "9dEVMESKXcMQNndoPc5ji9iTeDJ9GfToboy8prkZeT96",
    "marketBaseVault": "2y3BtF5oRBpLwdoaGjLkfmT3FY3YbZCKPbA9zvvx8Pz7",
    "marketQuoteVault": "6w5hF2hceQRZbaxjPJutiWSPAFWDkp3YbY2Aq3RpCSKe",
    "marketBids": "8qyWhEcpuvEsdCmY1kvEnkTfgGeWHmi73Mta5jgWDTuT",
    "marketAsks": "PPnJy6No31U45SVSjWTr45R8Q73X6bNHfxdFqr2vMq3",
    "marketEventQueue": "BC8Tdzz7rwvuYkJWKnPnyguva27PQP5DTxosHVQrEzg9"
});


const poolInfo = makePoolInfo(
    JSON.parse(`{"status":1,"coin_decimals":9,"pc_decimals":6,"lp_decimals":9,"pool_pc_amount":5251130081936,"pool_coin_amount":55678177545869,"pool_lp_supply":78193340906657,"pool_open_time":0,"amm_id":"ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix"}`)
)

const fromTokenStr: string = "USDC";
const toTokenStr: string = "mSOL";

const fromToken = fromTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[fromTokenStr];
const toToken = toTokenStr === "SOL" ? NATIVE_SOL : MAINNET_SPL_TOKENS[toTokenStr];


const amountOut = RaydiumRateFuncs.getRate(poolKeys, poolInfo, fromToken, toToken, 5);

console.log(amountOut.amountOut.toFixed(6));