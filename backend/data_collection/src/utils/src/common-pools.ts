import fetch from "node-fetch"

const ORCA_API_POOL_ENDPOINT = "https://api.orca.so/allPools";
const RAYDIUM_API_POOL_ENDPOINT = "https://api.raydium.io/pairs";

const FILTER_COIN = "USDC"

const enum poolAMM {
    Orca,
    Raydium
}

// Filters pools by name for specific coin
function filterPoolName(data, coin: string, amm: poolAMM) {
    return (amm == poolAMM.Orca) ?
        Object.keys(data).filter(k => k.includes(coin)).map(x => x.replace('[aquafarm]', '').replace('[stable]', '')) :
        data.filter(e => e.name.includes(coin)).sort((p1, p2) => p1.volume_24h * p1.price - p2.volume_24h * p2.price).reverse().map(x => x.name.replace('-', '/'));
}

(async () => {
    const orcaPoolsRaw = await fetch(ORCA_API_POOL_ENDPOINT).then((res) => res.json());
    const orcaPools = filterPoolName(orcaPoolsRaw, FILTER_COIN, poolAMM.Orca);

    const raydiumPoolsRaw = await fetch(RAYDIUM_API_POOL_ENDPOINT).then(res => res.json());
    const raydiumPools = filterPoolName(raydiumPoolsRaw, FILTER_COIN, poolAMM.Raydium)

    const commonPools = new Set(orcaPools.filter(function(e) {
        return raydiumPools.indexOf(e) >= 0;
    }));
    
    console.log(commonPools)
})().catch((e) => console.error(e));