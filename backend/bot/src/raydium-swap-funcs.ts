import { LIQUIDITY_PROGRAM_ID_V4, nu64, SERUM_PROGRAM_ID_V3, SERUM_VERSION_TO_PROGRAMID, SplTokenInfo, struct, u8, WSOL } from "@raydium-io/raydium-sdk";
import { Account, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Signer, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TokenAmount } from "./raydium-utils/safe-math";
import { closeAccount } from '@project-serum/serum/lib/token-instructions'
import { createAssociatedTokenAccountIfNotExist, createTokenAccountIfNotExist } from "./raydium-utils/web3";

interface TokenInfo {
    symbol: string;
    name: string;

    mintAddress: string;
    decimals: number;
    totalSupply?: TokenAmount;

    referrer?: string;

    details?: string;
    docs?: object;
    socials?: object;

    tokenAccountAddress?: string;
    balance?: TokenAmount;
    tags: string[];
}

export const NATIVE_SOL: SplTokenInfo = {
    symbol: "SOL",
    name: "Native Solana",
    mint: "11111111111111111111111111111111",
    decimals: 9,
    extensions: {}
};

function getBigNumber(num: any) {
    return num === undefined || num === null ? 0 : parseFloat(num.toString());
}

export async function swap(
    connection: Connection,
    owner: Keypair,
    poolKeys: any,
    from: SplTokenInfo,
    to: SplTokenInfo,
    fromTokenAccount: string,
    toTokenAccount: string,
    aIn: string,
    aOut: string,
    wsolAddress: string
) {
    const transaction = new Transaction();
    const signers = [owner];

    if (!from || !to) {
        throw new Error("Miss token info");
    }

    let fromCoinMint = from.mint;
    let toCoinMint = to.mint;

    const amountIn = new TokenAmount(aIn, from.decimals, false);
    const amountOut = new TokenAmount(aOut, to.decimals, false);

    if (fromCoinMint === NATIVE_SOL.mint && wsolAddress) {
        transaction.add(
            closeAccount({
                source: new PublicKey(wsolAddress),
                destination: owner.publicKey,
                owner: owner.publicKey
            })
        );
        console.log(`[!] closeAccount WSOL ${wsolAddress}`)
    }

    if (fromCoinMint === NATIVE_SOL.mint) {
        fromCoinMint = WSOL.mint;
    }
    if (toCoinMint === NATIVE_SOL.mint) {
        toCoinMint = WSOL.mint;
    }

    // from
    let fromWrappedSolAcc: PublicKey | null = null;
    
    // to
    let toWrappedSolAcc: PublicKey | null = null;

    let newFromTokenAccount = PublicKey.default;
    let newToTokenAccount = PublicKey.default;

    if (fromCoinMint === WSOL.mint) {
        console.log(`[!] fromCoin WSOL ${getBigNumber(amountIn.wei) + 1e7}`)
        fromWrappedSolAcc = await createTokenAccountIfNotExist(
            connection,
            null,
            owner.publicKey,
            WSOL.mint,
            getBigNumber(amountIn.wei) + 1e7,
            transaction,
            signers
        );
    } else {
        console.log(`[!] fromCoin createTokenAccountIfNotExist Other`)
        newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(
            fromTokenAccount,
            owner.publicKey,
            fromCoinMint,
            transaction
        );
    }

    if (toCoinMint === WSOL.mint) {
        console.log(`[!] toCoin createTokenAccountIfNotExist WSOL ${1e7}`)
        toWrappedSolAcc = await createTokenAccountIfNotExist(
            connection,
            null,
            owner.publicKey,
            WSOL.mint,
            1e7,
            transaction,
            signers
        );
    } else {
        console.log(`[!] toCoin createTokenAccountIfNotExist Other`)
        newToTokenAccount = await createAssociatedTokenAccountIfNotExist(
            toTokenAccount,
            owner.publicKey,
            toCoinMint,
            transaction
        );
    }

    transaction.add(
        poolKeys.version !== 5
            ? swapInstruction(
                poolKeys.programId,
                poolKeys.id,
                poolKeys.authority,
                poolKeys.openOrders,
                poolKeys.targetOrders,
                poolKeys.baseVault,
                poolKeys.quoteVault,
                poolKeys.marketProgramId,
                poolKeys.marketId,
                poolKeys.marketBids,
                poolKeys.marketAsks,
                poolKeys.marketEventQueue,
                poolKeys.marketBaseVault,
                poolKeys.marketQuoteVault,
                poolKeys.marketAuthority,
                fromWrappedSolAcc ?? newFromTokenAccount,
                toWrappedSolAcc ?? newToTokenAccount,
                owner.publicKey,
                Math.floor(getBigNumber(amountIn.toWei())),
                Math.floor(getBigNumber(amountOut.toWei()))
            )
            : swapStableBaseInInstruction(
                poolKeys.programId,
                poolKeys.marketId,
                poolKeys.authority,
                poolKeys.openOrders,
                poolKeys.baseVault,
                poolKeys.quoteVault,
                poolKeys.modelDataAccount,
                poolKeys.marketProgramId,
                poolKeys.marketId,
                poolKeys.marketBids,
                poolKeys.marketAsks,
                poolKeys.marketEventQueue,
                poolKeys.marketBaseVault,
                poolKeys.marketQuoteVault,
                poolKeys.marketAuthority,
                fromWrappedSolAcc ?? newFromTokenAccount,
                toWrappedSolAcc ?? newToTokenAccount,
                owner.publicKey,
                Math.floor(getBigNumber(amountIn.toWei())),
                Math.floor(getBigNumber(amountOut.toWei()))
            )
    );

    if (fromWrappedSolAcc) {
        console.log("[!] from closeAccount WSOL")
        transaction.add(
            closeAccount({
                source: fromWrappedSolAcc,
                destination: owner.publicKey,
                owner: owner.publicKey,
            })
        );
    }
    if (toWrappedSolAcc) {
        console.log("[!] to closeAccount WSOL")
        transaction.add(
            closeAccount({
                source: toWrappedSolAcc,
                destination: owner.publicKey,
                owner: owner.publicKey,
            })
        );
    }

    signers.push(owner)

    console.log(JSON.stringify(transaction, null, 4))
    return await sendAndConfirmTransaction(connection, transaction, signers, {commitment:"finalized",maxRetries:5});
}

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

export function swapInstruction(
    programId: PublicKey,
    // tokenProgramId: PublicKey,
    // amm
    ammId: PublicKey,
    ammAuthority: PublicKey,
    ammOpenOrders: PublicKey,
    ammTargetOrders: PublicKey,
    poolCoinTokenAccount: PublicKey,
    poolPcTokenAccount: PublicKey,
    // serum
    serumProgramId: PublicKey,
    serumMarket: PublicKey,
    serumBids: PublicKey,
    serumAsks: PublicKey,
    serumEventQueue: PublicKey,
    serumCoinVaultAccount: PublicKey,
    serumPcVaultAccount: PublicKey,
    serumVaultSigner: PublicKey,
    // user
    userSourceTokenAccount: PublicKey,
    userDestTokenAccount: PublicKey,
    userOwner: PublicKey,

    amountIn: number,
    minAmountOut: number
): TransactionInstruction {
    const dataLayout = struct([
        u8("instruction"),
        nu64("amountIn"),
        nu64("minAmountOut"),
    ]);

    const keys = [
        // spl token
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // amm
        { pubkey: ammId, isSigner: false, isWritable: true },
        { pubkey: ammAuthority, isSigner: false, isWritable: false },
        { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
        { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
        { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
        // serum
        { pubkey: serumProgramId, isSigner: false, isWritable: false },
        { pubkey: serumMarket, isSigner: false, isWritable: true },
        { pubkey: serumBids, isSigner: false, isWritable: true },
        { pubkey: serumAsks, isSigner: false, isWritable: true },
        { pubkey: serumEventQueue, isSigner: false, isWritable: true },
        { pubkey: serumCoinVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumPcVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumVaultSigner, isSigner: false, isWritable: false },
        { pubkey: userSourceTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userDestTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: false },
    ];

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 9,
            amountIn,
            minAmountOut,
        },
        data
    );

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}

export function swapStableBaseInInstruction(
    programId: PublicKey,
    // tokenProgramId: PublicKey,
    // amm
    ammId: PublicKey,
    ammAuthority: PublicKey,
    ammOpenOrders: PublicKey,
    poolCoinTokenAccount: PublicKey,
    poolPcTokenAccount: PublicKey,
    modelDataAccount: PublicKey,
    // serum
    serumProgramId: PublicKey,
    serumMarket: PublicKey,
    serumBids: PublicKey,
    serumAsks: PublicKey,
    serumEventQueue: PublicKey,
    serumCoinVaultAccount: PublicKey,
    serumPcVaultAccount: PublicKey,
    serumVaultSigner: PublicKey,
    // user
    userSourceTokenAccount: PublicKey,
    userDestTokenAccount: PublicKey,
    userOwner: PublicKey,

    amountIn: number,
    minAmountOut: number
): TransactionInstruction {
    const dataLayout = struct([
        u8("instruction"),
        nu64("amountIn"),
        nu64("minAmountOut"),
    ]);

    const keys = [
        // spl token
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // amm
        { pubkey: ammId, isSigner: false, isWritable: true },
        { pubkey: ammAuthority, isSigner: false, isWritable: false },
        { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
        { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
        { pubkey: modelDataAccount, isSigner: false, isWritable: false },
        // serum
        { pubkey: serumProgramId, isSigner: false, isWritable: false },
        { pubkey: serumMarket, isSigner: false, isWritable: true },
        { pubkey: serumBids, isSigner: false, isWritable: true },
        { pubkey: serumAsks, isSigner: false, isWritable: true },
        { pubkey: serumEventQueue, isSigner: false, isWritable: true },
        { pubkey: serumCoinVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumPcVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumVaultSigner, isSigner: false, isWritable: false },
        { pubkey: userSourceTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userDestTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: false },
    ];

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 9,
            amountIn,
            minAmountOut,
        },
        data
    );

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
}


export function getSwapOutAmount(
    poolInfo: any,
    fromCoinMint: string,
    toCoinMint: string,
    amount: string,
    slippage: number
) {
    const { coin, pc } = poolInfo
    // const { swapFeeNumerator, swapFeeDenominator } = fees

    if (fromCoinMint === WSOL.mint) fromCoinMint = NATIVE_SOL.mint
    if (toCoinMint === WSOL.mint) toCoinMint = NATIVE_SOL.mint

    if (fromCoinMint === coin.mintAddress && toCoinMint === pc.mintAddress) {
        // coin2pc
        const fromAmount = new TokenAmount(amount, coin.decimals, false)
        const fromAmountWithFee = fromAmount.wei
            // .multipliedBy(swapFeeDenominator - swapFeeNumerator)
            // .dividedBy(swapFeeDenominator)

        const denominator = coin.balance.wei.plus(fromAmountWithFee)
        const amountOut = pc.balance.wei.multipliedBy(fromAmountWithFee).dividedBy(denominator)
        const amountOutWithSlippage = amountOut.dividedBy(1 + slippage / 100)

        const outBalance = pc.balance.wei.minus(amountOut)
        const beforePrice = new TokenAmount(
            parseFloat(new TokenAmount(pc.balance.wei, pc.decimals).fixed()) /
            parseFloat(new TokenAmount(coin.balance.wei, coin.decimals).fixed()),
            pc.decimals,
            false
        )
        const afterPrice = new TokenAmount(
            parseFloat(new TokenAmount(outBalance, pc.decimals).fixed()) /
            parseFloat(new TokenAmount(denominator, coin.decimals).fixed()),
            pc.decimals,
            false
        )
        const priceImpact =
            Math.abs((parseFloat(beforePrice.fixed()) - parseFloat(afterPrice.fixed())) / parseFloat(beforePrice.fixed())) *
            100

        return {
            amountIn: fromAmount,
            amountOut: new TokenAmount(amountOut, pc.decimals),
            amountOutWithSlippage: new TokenAmount(amountOutWithSlippage, pc.decimals),
            priceImpact
        }
    } else {
        // pc2coin
        const fromAmount = new TokenAmount(amount, pc.decimals, false)
        const fromAmountWithFee = fromAmount.wei
            // .multipliedBy(swapFeeDenominator - swapFeeNumerator)
            // .dividedBy(swapFeeDenominator)

        const denominator = pc.balance.wei.plus(fromAmountWithFee)
        const amountOut = coin.balance.wei.multipliedBy(fromAmountWithFee).dividedBy(denominator)
        const amountOutWithSlippage = amountOut.dividedBy(1 + slippage / 100)

        const outBalance = coin.balance.wei.minus(amountOut)

        const beforePrice = new TokenAmount(
            parseFloat(new TokenAmount(pc.balance.wei, pc.decimals).fixed()) /
            parseFloat(new TokenAmount(coin.balance.wei, coin.decimals).fixed()),
            pc.decimals,
            false
        )
        const afterPrice = new TokenAmount(
            parseFloat(new TokenAmount(denominator, pc.decimals).fixed()) /
            parseFloat(new TokenAmount(outBalance, coin.decimals).fixed()),
            pc.decimals,
            false
        )
        const priceImpact =
            Math.abs((parseFloat(afterPrice.fixed()) - parseFloat(beforePrice.fixed())) / parseFloat(beforePrice.fixed())) *
            100

        return {
            amountIn: fromAmount,
            amountOut: new TokenAmount(amountOut, coin.decimals),
            amountOutWithSlippage: new TokenAmount(amountOutWithSlippage, coin.decimals),
            priceImpact
        }
    }
}
