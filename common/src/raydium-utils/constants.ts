import { LiquidityPoolJsonInfo } from "@raydium-io/raydium-sdk";

export const RAYDIUM_POOLS_ENDPOINT = "https://sdk.raydium.io/liquidity/mainnet.json";

export const listeners = [
  "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2", // SOL-USDC
  "C5yXRTp39qv5WZrfiqoqeyK6wvbqS97oBqbsDUqfZyu", // ORCA-USDC
  "33dWwj33J3NUzoTmkMAUq1VdXZL89qezxkdaHdN88vK2", // LIQ-USDC
  "5TgJXpv6H3KJhHCuP7KoDLSCmi8sM8nABizP7CmYAKm1", // SNY-USDC
  "ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix", // mSOL-USDC
  "7XXKU8oGDbeGrkPyK5yHKzdsrMJtB7J2TMugjbrXEhB5", // SLRS-USDC
  "6nJes56KF999Q8VtQTrgWEHJGAfGMuJktGb8x2uWff2u", // PORT-USDC
  "DudevotmDLN3KDHA1uTV1AyTYdwGnKUDFEXS9AXLjQ1z", // SBR-USDC
  "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg", // RAY-USDC
  "2bnZ1edbvK3CK3LTNZ5jH9anvXYCmzPR4W2HQ6Ngsv5K", // ATLAS-USDC
  "34tFULRrRwh4bMcBLPtJaNqqe5pVgGZACi5sR8Xz95KC", // MNGO-USDC
  "FSSRqrGrDjDXnojhSDrDBknJeQ83pyACemnaMLaZDD1U", // UPS-USDC
  "HMDDVchYSP4uJBNFnWrNHg5rV2efy84TkVf733RPHm9k", // Alt: LIQ-USDC
  "EpJa1MJJykeLqzFJ6pWasTfDWSS2WF7kkxu4pyowmYBY", // Alt: SLIM-USDC
  "6sKXLBCZuvgbpM77y2J8YsoCZsqRqjWDgAudEYvgzf1c", // Alt: SLIM-USDC
  "3gSjs6MqyHFsp8DXvaKvVUJjV7qg5itf9qmUGuhnSaWH"  // Alt: SOL-USDC
];

export const poolMintAddrToName = {
  "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2": "RAYDIUM_SOL_USDC",
  "C5yXRTp39qv5WZrfiqoqeyK6wvbqS97oBqbsDUqfZyu": "RAYDIUM_ORCA_USDC",
  "33dWwj33J3NUzoTmkMAUq1VdXZL89qezxkdaHdN88vK2": "RAYDIUM_LIQ_USDC",
  "5TgJXpv6H3KJhHCuP7KoDLSCmi8sM8nABizP7CmYAKm1": "RAYDIUM_SNY_USDC",
  "ZfvDXXUhZDzDVsapffUyXHj9ByCoPjP4thL6YXcZ9ix": "RAYDIUM_mSOL_USDC",
  "7XXKU8oGDbeGrkPyK5yHKzdsrMJtB7J2TMugjbrXEhB5": "RAYDIUM_SLRS_USDC",
  "6nJes56KF999Q8VtQTrgWEHJGAfGMuJktGb8x2uWff2u": "RAYDIUM_PORT_USDC",
  "DudevotmDLN3KDHA1uTV1AyTYdwGnKUDFEXS9AXLjQ1z": "RAYDIUM_SBR_USDC",
  "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg": "RAYDIUM_RAY_USDC",
  "2bnZ1edbvK3CK3LTNZ5jH9anvXYCmzPR4W2HQ6Ngsv5K": "RAYDIUM_ATLAS_USDC",
  "34tFULRrRwh4bMcBLPtJaNqqe5pVgGZACi5sR8Xz95KC": "RAYDIUM_MNGO_USDC",
  "FSSRqrGrDjDXnojhSDrDBknJeQ83pyACemnaMLaZDD1U": "RAYDIUM_UPS_USDC",
  "EpJa1MJJykeLqzFJ6pWasTfDWSS2WF7kkxu4pyowmYBY": "RAYDIUM|EpJa_SLIM_USDC",
  "6sKXLBCZuvgbpM77y2J8YsoCZsqRqjWDgAudEYvgzf1c": "RAYDIUM|6sKX_SLIM_USDC",
  "HMDDVchYSP4uJBNFnWrNHg5rV2efy84TkVf733RPHm9k": "RAYDIUM|HMDD_LIQ_USDC",
  "3gSjs6MqyHFsp8DXvaKvVUJjV7qg5itf9qmUGuhnSaWH": "RAYDIUM|3gSj_SOL_USDC"
};


export const moreUnofficialLpPools: LiquidityPoolJsonInfo[] = [
  {
    id: "FyqYBBJ8vhr5AtDZiyJue4Khx9Be6Xijx5nm6aL6wZZV",
    programId: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    marketAuthority: "8BJwHZek2AmYVrsomc82aSAtod4r99fVhf3L5b8AtSrb",
    marketQuoteVault: "2jT8622k6RyXkgJFvLmm7xoTrdLac9Aa6rZKP46w7E87",
    marketBaseVault: "9JQsP7B8L4KiSakVDaWcDuSofUKnRweRchEnFNX8CvaB",
    marketEventQueue: "7k6y9jPsmXRiK53q7hKmiLThxFt61HAuYS46vxXi9uji",
    marketAsks: "H8b5qP1JSP7XAwMDpx1ptGz66Tf21xQWhTHsKmMV7jPu",
    marketBids: "2UxFySzJ4TZ2UCmKj1jtTpBTXxYxzUkWYHo31MqJh1ac",
    marketId: "3xGWh76WXVvxMWearhJJYtuN1NazD4eEaafAAnWXL757",
    marketProgramId: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    quoteVault: "8KKZ4LR5Q1T1SVQ2DaCfZ83NHr56152A5NMhDDVCCdVt",
    baseVault: "79uBcM1XJWY7NT1UfydKH2jM7nepWSidJA2Khf3jfwm9",
    targetOrders: "6YJqaJqVSMdcSdojokf8cwwpnQpdTGoGiWu2oYeCJMJ8",
    openOrders: "2if3HMMqGZAKeETqAbPCxhy5obdhs2BbiMTqkGLQhRqw",
    authority: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    version: 4,
    baseMint: "So11111111111111111111111111111111111111112",
    quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    lpMint: "So11111111111111111111111111111111111111112",
    lpVault: "So11111111111111111111111111111111111111112",
    withdrawQueue: "22JaAuHiAe6meqT7n1SgXtkPc5STtNJqdqkVhNWNGJbd",
    marketVersion: 3
  }
]
