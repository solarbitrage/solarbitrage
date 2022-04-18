import { Connection, Commitment, ConnectionConfig } from "@solana/web3.js";

export const CONNECTION_COMMITMENT = (process.env.CONNECTION_COMMITMENT ?? "singleGossip") as Commitment;
export const CONNECTION_ENDPOINT_LIST = [
    "https://solana--mainnet.datahub.figment.io/apikey/d834b93190a19388cd7c015cfa21b844/",
    "https://solana--mainnet.datahub.figment.io/apikey/5346b90a5de1697d94d6eb94e0cb4858/",
    "https://solana--mainnet.datahub.figment.io/apikey/5778a58d381b2846cf87381a35b071ea/",
    "https://solana--mainnet.datahub.figment.io/apikey/274401e69faa03c939ff45906e3b532e/",
    "https://solana--mainnet.datahub.figment.io/apikey/448fd27a06158b3b5a120a6800bceb11/",
    "https://solana--mainnet.datahub.figment.io/apikey/f84e82b9718330d588c3a45985214219/",
    "https://solana--mainnet.datahub.figment.io/apikey/6bbbf6472f457715754e2dd12f4a6b2b/",
    "https://solana--mainnet.datahub.figment.io/apikey/7420af7f219764968c91b3b4e256324a/",
    "https://solana--mainnet.datahub.figment.io/apikey/a4e126b6c16b142e08f70896357fe1cd/",
    "https://ssc-dao.genesysgo.net/",
    "https://solana-api.projectserum.com",
    "https://public-rpc.blockpi.io/http/solana",
    "https://solana.public-rpc.com",
    "https://solana--mainnet.datahub.figment.io/apikey/7c82f707593b1df3b484f84543e10cd6/",
]

export const useConnection = (logChange?: boolean, config?: ConnectionConfig) => {
    let connectionIndex = 0;

    const connections = CONNECTION_ENDPOINT_LIST.map(endpoint => new Connection(endpoint, { commitment: CONNECTION_COMMITMENT, ...config }));

    /**
     * Cycle through list of solana mainnet endpoints (to distribute load and avoid rate limits)
     */
    return () => {
        if (!!process.env.CONNECTION_ENDPOINT) {
            return new Connection(process.env.CONNECTION_ENDPOINT, CONNECTION_COMMITMENT);
        }

        if (logChange) {
            console.log("[connection] NEW CONNECTION:", CONNECTION_ENDPOINT_LIST[connectionIndex])
        }
        const c = connections[connectionIndex];
        connectionIndex = (connectionIndex + 1) % CONNECTION_ENDPOINT_LIST.length;

        return c;
    }
}