import fetch from "node-fetch"

const ORCA_API_POOL_ENDPOINT = "https://api.orca.so/allPools";
const RAYDIUM_API_POOL_ENDPOINT = "https://api.raydium.io/pools";

const FILTER_COIN = "USDC"

const enum poolAMM {
    Orca,
    Raydium
}

// Filters pools by name for specific coin
function filterPoolName(data, coin: string, amm: poolAMM) {
    return (amm == poolAMM.Orca) ?
        Object.keys(data).filter(k => k.includes(coin)).map(x => x.replace('[aquafarm]', '').replace('[stable]', '')) :
        data.filter(e => e.identifier.includes(coin)).map(x => x.identifier.replace('-', '/'));
}

(async () => {
    const orcaPoolsRaw = await fetch(ORCA_API_POOL_ENDPOINT).then((res) => res.json());
    const orcaPools = filterPoolName(orcaPoolsRaw, FILTER_COIN, poolAMM.Orca);

    const raydiumPoolsRaw = await fetch(RAYDIUM_API_POOL_ENDPOINT).then(res => res.json());
    const raydiumPools = filterPoolName(raydiumPoolsRaw, FILTER_COIN, poolAMM.Raydium)

    const commonPools = new Set(orcaPools.filter(function(e) {
        return raydiumPools.indexOf(e) >= 0;
    }));
    
    console.log(commonPools.size)
})().catch((e) => console.error(e));