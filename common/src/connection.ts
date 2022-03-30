import { Connection, Commitment } from "@solana/web3.js";

export const CONNECTION_COMMITMENT = (process.env.CONNECTION_COMMITMENT ?? "singleGossip") as Commitment;
export const CONNECTION_ENDPOINT_LIST = [
    "https://old-spring-shape.solana-mainnet.quiknode.pro/9c3788e894cbb3cdeb16e86e7664ba2f558887e7/",
    "https://bold-autumn-wind.solana-mainnet.quiknode.pro/407833d614aa8ca24bf439fff7d1d7e846d56452/",
    "https://solana--mainnet.datahub.figment.io/apikey/d834b93190a19388cd7c015cfa21b844/",
    "https://solana--mainnet.datahub.figment.io/apikey/5346b90a5de1697d94d6eb94e0cb4858/",
    "https://solana--mainnet.datahub.figment.io/apikey/5778a58d381b2846cf87381a35b071ea/",
    "https://solana--mainnet.datahub.figment.io/apikey/274401e69faa03c939ff45906e3b532e/",
    "https://solana-api.projectserum.com/",
    "https://api.mainnet-beta.solana.com/",
]

export const useConnection = () => {
    let connectionIndex = 0;

    /**
     * Cycle through list of solana mainnet endpoints (to distribute load and avoid rate limits)
     */
    return () => {
        if (!!process.env.CONNECTION_ENDPOINT) {
            return new Connection(process.env.CONNECTION_ENDPOINT, CONNECTION_COMMITMENT);
        }

        const c = new Connection(CONNECTION_ENDPOINT_LIST[connectionIndex], CONNECTION_COMMITMENT);
        connectionIndex = (connectionIndex + 1) % CONNECTION_ENDPOINT_LIST.length;

        return c;
    }
}