import { getTokens, Instruction, OrcaPool, OrcaToken, OrcaU64, resolveOrCreateAssociatedTokenAddress, TransactionBuilder, TransactionPayload, U64Utils, } from "@orca-so/sdk";
import { Owner } from "@orca-so/sdk/dist/public/utils/web3/key-utils";
import { createApprovalInstruction, createSwapInstruction } from "@orca-so/sdk/dist/public/utils/web3/instructions/pool-instructions";
import { Keypair, PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";
import Decimal from "decimal.js";

const solToken: OrcaToken = Object.freeze({
    tag: "SOL",
    name: "Solana",
    mint: new PublicKey("So11111111111111111111111111111111111111112"),
    scale: 9,
});

export async function swap(
    pool: OrcaPool,
    owner: Keypair | PublicKey,
    inputToken: OrcaToken,
    amountIn: Decimal | OrcaU64,
    minimumAmountOut: Decimal | OrcaU64,
    inputPoolTokenUserAddress: PublicKey,
    outputPoolTokenUserAddress: PublicKey,
    approvalInstruction?: {
        userTransferAuthority: Keypair;
    } & Instruction
) {
    const _owner = new Owner(owner);

    const ownerAddress = _owner.publicKey;

    const { inputPoolToken, outputPoolToken } = getTokens(
        (pool as any).poolParams,
        inputToken.mint.toString()
    );
    const amountInU64 = U64Utils.toTokenU64(amountIn, inputPoolToken, "amountIn");
    const minimumAmountOutU64 = U64Utils.toTokenU64(
        minimumAmountOut,
        outputPoolToken,
        "minimumAmountOut"
    );

    if (inputPoolTokenUserAddress === undefined || outputPoolTokenUserAddress === undefined) {
        throw new Error("Unable to derive input / output token associated address.");
    }

    let userTransferAuthority: Keypair;
    let inputDefinedApprovalInstr = !!approvalInstruction;

    if (!inputDefinedApprovalInstr) {
        approvalInstruction = createApprovalInstruction(
            ownerAddress,
            amountInU64,
            inputPoolTokenUserAddress
        );
        userTransferAuthority = approvalInstruction.userTransferAuthority;
    } else {
        userTransferAuthority = approvalInstruction.userTransferAuthority;
    }
            
    const swapInstruction = await createSwapInstruction(
        (pool as any).poolParams,
        _owner,
        inputPoolToken,
        inputPoolTokenUserAddress,
        outputPoolToken,
        outputPoolTokenUserAddress,
        amountInU64,
        minimumAmountOutU64,
        userTransferAuthority.publicKey,
        (pool as any).orcaTokenSwapId
    );

    let transactionPayloadBuilder = await new TransactionBuilder((pool as any).connection, ownerAddress, _owner)
    // .addInstruction(resolveInputAddrInstructions)
    // .addInstruction(resolveOutputAddrInstructions)

    if (!inputDefinedApprovalInstr) {
        transactionPayloadBuilder = transactionPayloadBuilder.addInstruction(approvalInstruction)
    }

    const transactionPayload = await transactionPayloadBuilder
        .addInstruction(swapInstruction).build();

    return {
        transactionPayload,
        wrappedSolAcc: outputPoolToken.mint.equals(solToken.mint) ? 
            outputPoolTokenUserAddress : 
            (inputPoolToken.mint.equals(solToken.mint) ? 
                inputPoolTokenUserAddress : undefined),
            
    }
}