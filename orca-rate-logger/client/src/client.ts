import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from "@solana/web3.js";
import { promises } from "fs";
import { AccountMetaReadonly, jsonInfo2PoolKeys, Liquidity, LiquidityPoolJsonInfo, TokenAmount, WSOL } from "@raydium-io/raydium-sdk";
import { CONNECTION_COMMITMENT, CONNECTION_ENDPOINT_LIST, useConnection } from "./common/src/connection";
const { readFile } = promises;
import base from "base-x"
import { deserializeAccount } from "@orca-so/sdk";
import { parseLogForPoolInfo } from "./common/src/on-chain-rate-instruction-utils/utils";

const base58 = base("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")

const WALLET_KEY_PATH = process.env.WALLET_KEY_PATH ?? "/home/corridor/development/solarbitrage/backend/bot/wallet-keypair.json"


async function main() {
    debugger;
    // ==== Setup 
    // Read secret key file to get owner keypair
    const secretKeyString = await readFile(WALLET_KEY_PATH, {
        encoding: "utf8",
    });

    // get wallet credentials
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const owner = Keypair.fromSecretKey(secretKey);
    console.log("wallet creds");

    const devnetConnection = new Connection("https://api.devnet.solana.com", CONNECTION_COMMITMENT);

    const transaction = new Transaction();
    transaction.feePayer = owner.publicKey;
    transaction.add(new TransactionInstruction({
        programId: new PublicKey("8D7UaJcASNVK9m6wbJvRebPFn6kbfg5m2t4Vt8MpKxrL"),
        keys: [
            AccountMetaReadonly(new PublicKey("7WgXxjzrB1826gECC1r69au9Ea5tstuCBpqV5Avb5Bm9"), false),
            AccountMetaReadonly(new PublicKey("7WgXxjzrB1826gECC1r69au9Ea5tstuCBpqV5Avb5Bm9"), false),
            AccountMetaReadonly(new PublicKey(owner.publicKey), true)
        ],
        data: Buffer.from("Hello Blockchain!")
    }));

    const result = await sendAndConfirmTransaction(devnetConnection, transaction, [owner], { commitment: "finalized" });

    console.log(result);
    const res = await devnetConnection.getParsedTransaction(result, "finalized");
    console.log(res.meta.logMessages);
    const accRes = parseLogForPoolInfo(res?.meta.logMessages);

    const inputAccParsed =deserializeAccount(Buffer.from(base58.decode(accRes.inputAcc)));
    const outputAccParsed =deserializeAccount(Buffer.from(base58.decode(accRes.outputAcc)));

    console.log({...accRes, inputAccParsed, outputAccParsed}, inputAccParsed.amount.toNumber());
}

main();