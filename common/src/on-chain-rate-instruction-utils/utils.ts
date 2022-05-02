import BN from "bn.js";

export const makePoolInfo = (json: any) => {
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

export function parseMsg(msg: string) {
    const [routeOrder, poolAddrs0, poolAddrs1, baseToken, middleToken, startingAmount, afterFirstSwap, afterSecondSwap] = msg.split("\n");

    const mapping = [
        `ORCA_${middleToken}_${baseToken} -> RAYDIUM_${middleToken}_${baseToken}`,
        `RAYDIUM_${middleToken}_${baseToken} -> ORCA_${middleToken}_${baseToken}`,
        `ORCA_${middleToken}_${baseToken} -> ORCA_${middleToken}_${baseToken}`,
        `RAYDIUM_${middleToken}_${baseToken} -> RAYDIUM_${middleToken}_${baseToken}`,
    ]

    return {
        route: mapping[parseInt(routeOrder)],
        poolAddrs: [poolAddrs0, poolAddrs1],
        baseToken,
        middleToken,
        startingAmount: parseFloat(startingAmount),
        afterFirstSwap: parseFloat(afterFirstSwap),
        afterSecondSwap: parseFloat(afterSecondSwap),
    }
}

export function parseLogForPoolInfo(logs: string[]): [{ msg: string, inputAcc: number, outputAcc: number}, string[]] {
    const logStart = logs.findIndex(l => l.includes("Program 8D7UaJcASNVK9m6wbJvRebPFn6kbfg5m2t4Vt8MpKxrL invoke")) + 1;
    const logEnd = logs.findIndex(l => l.includes("Program 8D7UaJcASNVK9m6wbJvRebPFn6kbfg5m2t4Vt8MpKxrL success"));

    const slicedLogs = logs.slice(logStart, logEnd);

    if (slicedLogs.length <= 0) {
        return [undefined, []];
    }

    const parsed = {
        msg: JSON.parse(slicedLogs[0].split("Program log: MSG: ")[1]) as string,
        inputAcc: JSON.parse(slicedLogs[1].split("Program log: INPUT_ACC_AMT: ")[1]) as number,
        outputAcc: JSON.parse(slicedLogs[2].split("Program log: OUTPUT_ACC_AMT: ")[1]) as number
    };

    return [parsed, logs.slice(logEnd)];
}

export function getRaydiumPoolInfoFromLogs(logs: string[]): [{
    status: BN;
    baseDecimals: number;
    quoteDecimals: number;
    lpDecimals: number;
    baseReserve: BN;
    quoteReserve: BN;
    lpSupply: BN;
}, string[]] {
    const logStart = logs.findIndex(l => l.includes("Program log: GetPoolData:"));
    const logEnd = logs.findIndex(l => l.includes("Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 success"));

    const slicedLogs = logs.slice(logStart, logEnd);

    if (slicedLogs.length <= 0) {
        return [undefined, []];
    }

    const poolInfo = makePoolInfo(JSON.parse(slicedLogs[0].split("Program log: GetPoolData:")[1].trim()));

    return [poolInfo, logs.slice(logEnd)];
}