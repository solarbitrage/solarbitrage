import { OrcaPoolConfig } from "@orca-so/sdk";
import { orcaPoolConfigs } from "@orca-so/sdk/dist/constants";
import { CurveType, OrcaPoolParams } from "@orca-so/sdk/dist/model/orca/pool/pool-types";
import { PublicKey } from "@solana/web3.js";
import { Percentage } from "@orca-so/sdk/dist/public/utils/models/percentage";
import * as Tokens from "@orca-so/sdk/dist/constants/tokens";


export const listeners: [OrcaPoolParams, string][] = [
    [orcaPoolConfigs[OrcaPoolConfig.SOL_USDC], "ORCA_SOL_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.ORCA_USDC], "ORCA_ORCA_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.LIQ_USDC], "ORCA_LIQ_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.SNY_USDC], "ORCA_SNY_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.mSOL_USDC], "ORCA_mSOL_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.SLIM_USDC], "ORCA_SLIM_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.SLRS_USDC], "ORCA_SLRS_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.PORT_USDC], "ORCA_PORT_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.SBR_USDC], "ORCA_SBR_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.RAY_USDC], "ORCA_RAY_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.ATLAS_USDC], "ORCA_ATLAS_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.MNGO_USDC], "ORCA_MNGO_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.UPS_USDC], "ORCA_UPS_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.ABR_USDC], "ORCA_ABR_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.FANT_USDC], "ORCA_FANT_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.SHDW_USDC], "ORCA_SHDW_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.WOOF_USDC], "ORCA_WOOF_USDC"],
    [orcaPoolConfigs[OrcaPoolConfig.SLC_USDC], "ORCA_SLC_USDC"],
    [Object.freeze({
        address: new PublicKey("6fTRDD7sYxCN7oyoSQaN1AWC3P2m8A6gVZzGrpej9DvL"),
        nonce: 253,
        authority: new PublicKey("B52XRdfTsh8iUGbGEBJLHyDMjhaTW8cAFCmpASGJtnNK"),
        poolTokenMint: new PublicKey("ECFcUGwHHMaZynAQpqRHkYeTBnS5GnPWZywM8aggcs3A"),
        poolTokenDecimals: 9,
        feeAccount: new PublicKey("4pdzKqAGd1WbXn1L4UpY4r58irTfjFYMYNudBrqbQaYJ"),
        tokenIds: [Tokens.solToken.mint.toString(), Tokens.usdcToken.mint.toString()],
        tokens: {
            [Tokens.solToken.mint.toString()]: {
                ...Tokens.solToken,
                addr: new PublicKey("FdiTt7XQ94fGkgorywN1GuXqQzmURHCDgYtUutWRcy4q"),
            },
            [Tokens.usdcToken.mint.toString()]: {
                ...Tokens.usdcToken,
                addr: new PublicKey("7VcwKUtdKnvcgNhZt5BQHsbPrXLxhdVomsgrr7k2N5P5"),
            },
        },
        curveType: CurveType.ConstantProduct,
        feeStructure: {
            traderFee: Percentage.fromFraction(25, 10000),
            ownerFee: Percentage.fromFraction(5, 10000),
        },
    }), "ORCA|6fTR_SOL_USDC"]
]