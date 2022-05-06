import { Connection, Commitment, ConnectionConfig } from "@solana/web3.js";

export const CONNECTION_COMMITMENT = (process.env.CONNECTION_COMMITMENT ?? "singleGossip") as Commitment;
export const CONNECTION_ENDPOINT_LIST = [
    "https://ssc-dao.genesysgo.net/",
    "https://solana--mainnet.datahub.figment.io/apikey/dc8777df6fba0d48b5448ba05b42b284/",
    "https://solana--mainnet.datahub.figment.io/apikey/5346b90a5de1697d94d6eb94e0cb4858/",
    "https://solana--mainnet.datahub.figment.io/apikey/5778a58d381b2846cf87381a35b071ea/",
    "https://solana--mainnet.datahub.figment.io/apikey/c55463700a6040e66f06f0eea60b7560",
    "https://solana--mainnet.datahub.figment.io/apikey/448fd27a06158b3b5a120a6800bceb11/",
    "https://solana--mainnet.datahub.figment.io/apikey/fd47f96f6728a4e3be60f4452437ab8e/",
    "https://solana--mainnet.datahub.figment.io/apikey/7b3ae379d6a4789770afb0609cd4cd6b/",
    "https://solana--mainnet.datahub.figment.io/apikey/7420af7f219764968c91b3b4e256324a/",
    "https://solana--mainnet.datahub.figment.io/apikey/a4e126b6c16b142e08f70896357fe1cd/",
    "https://solana-api.projectserum.com",
    "https://solana.public-rpc.com",
    "https://solana--mainnet.datahub.figment.io/apikey/7c82f707593b1df3b484f84543e10cd6/",
]

export const useConnection = (logChange?: boolean, config?: ConnectionConfig) => {
    let connectionIndex = Math.floor(Math.random() * CONNECTION_ENDPOINT_LIST.length);

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
