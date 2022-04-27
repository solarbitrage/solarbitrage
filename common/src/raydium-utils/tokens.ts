import { MAINNET_SPL_TOKENS as stockMainnetTokens, WSOL } from "@raydium-io/raydium-sdk"

export const MAINNET_SPL_TOKENS = {
    ...stockMainnetTokens,
    SOL: WSOL,
    ETH: {
        ...stockMainnetTokens["ETH"],
        decimals: 8,
    },
    FANT: {
        symbol: "FANT",
        name: "Fantom",
        decimals: 6,
        mint: "FANTafPFBAt93BNJVpdu25pGPmca3RfwdsDsRrT3LX1r",
        extensions: {
            coingeckoId: "fantom",
        }
    }
};