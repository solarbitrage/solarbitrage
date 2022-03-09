import { jsonInfo2PoolKeys, Liquidity, MAINNET_SPL_TOKENS, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFile } from "mz/fs";
import { NATIVE_SOL, swap } from "./raydium-swap-funcs";

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

const SOL_USDC_JSON = {
    "id": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
    "baseMint": "So11111111111111111111111111111111111111112",
    "quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "lpMint": "8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu",
    "version": 4,
    "programId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "authority": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    "openOrders": "HRk9CMrpq7Jn9sh7mzxE8CChHG8dneX9p475QKz4Fsfc",
    "targetOrders": "CZza3Ej4Mc58MnxWA385itCC9jCo3L1D7zc3LKy1bZMR",
    "baseVault": "DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz",
    "quoteVault": "HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz",
    "withdrawQueue": "G7xeGGLevkRwB5f44QNgQtrPKBdMfkT6ZZwpS9xcC97n",
    "lpVault": "Awpt6N7ZYPBa4vG4BQNFhFxDj4sxExAA9rpBAoBw2uok",
    "marketVersion": 3,
    "marketProgramId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "marketId": "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
    "marketAuthority": "F8Vyqk3unwxkXukZFQeYyGmFfTG3CAX4v24iyrjEYBJV",
    "marketBaseVault": "36c6YqAwyGKQG66XEp2dJc5JqjaBNv7sVghEtJv4c7u6",
    "marketQuoteVault": "8CFo8bL8mZQK8abbFyypFMwEDd8tVJjHTTojMLgQTUSZ",
    "marketBids": "14ivtgssEBoBjuZJtSAPKYgpUK7DmnSwuPMqJoVTSgKJ",
    "marketAsks": "CEQdAFKdycHugujQg9k2wbmxjcpdYZyVLfV9WerTnafJ",
    "marketEventQueue": "5KKsLVU6TcbVDK4BS6K1DGDxnh4Q9xjYJ8XaDCG5t8ht"
}

const main = async () => {
    const secretKeyString = await readFile(
        "../data_collection/wallets/test-keypair.json",
        {
            encoding: "utf8",
        }
    );

    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const owner = Keypair.fromSecretKey(secretKey);

    const connection = new Connection("https://api.mainnet-beta.solana.com", "singleGossip");
    //   const connection = new Connection(
    //     "https://api.devnet.solana.com",
    //     "singleGossip"
    //   );

    const poolKeys = jsonInfo2PoolKeys(SOL_USDC_JSON);

    // how much are we putting in the pool?
    const fromCoinAmount = "4.000"

    // minimum we expect out (should be fromCoin amount times conversion rate times (1 - slippage))
    const toCoinAmount = "0.046155"

    const fromToken = MAINNET_SPL_TOKENS["USDC"]
    const toToken = NATIVE_SOL

    // const { amountOutWithSlippage } = getSwapOutAmount(
    //     {coin: NATIVE_SOL, pc: usdcToken},
    //     NATIVE_SOL, 
    //     usdcToken.mint, 
    //     fromCoinAmount,
    //     slippage
    // )

    // console.log(amountOutWithSlippage)
    // return

    const accounts = await connection.getParsedTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID })
    
    const tokenAccounts = {};
    for (const tokenAccountInfo of accounts.value) {
        const tokenAccountPubkey = tokenAccountInfo.pubkey
        const tokenAccountAddress = tokenAccountPubkey.toBase58()
        const parsedInfo = tokenAccountInfo.account.data.parsed.info
        const mintAddress = parsedInfo.mint
        const balance = new TokenAmount(parsedInfo.tokenAmount.amount, parsedInfo.tokenAmount.decimals)

        tokenAccounts[mintAddress] = {
            tokenAccountAddress,
            balance
        }
    }

    console.log(tokenAccounts, tokenAccounts[fromToken.mint], tokenAccounts[toToken.mint])

    const res = await swap(
        connection, 
        owner, 
        poolKeys, 
        fromToken, 
        toToken, 
        tokenAccounts[fromToken.mint]?.tokenAccountAddress, 
        tokenAccounts[toToken.mint]?.tokenAccountAddress,
        fromCoinAmount,
        toCoinAmount,
        tokenAccounts[WSOL.mint]?.tokenAccountAddress
    );

    console.log(res);

};

main().then(() => process.exit(0)).catch((e) => console.error(e));
