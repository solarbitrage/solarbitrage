import { Liquidity, LiquidityPoolInfo, LiquidityPoolKeysV4, Percent, SplTokenInfo, Token, TokenAmount } from "@raydium-io/raydium-sdk";

export const getRate = (poolKeys: LiquidityPoolKeysV4, poolInfo: LiquidityPoolInfo,  splTokenIn: SplTokenInfo, splTokenOut: SplTokenInfo, amountIn: number = 1) =>  {
    const tokenIn = new Token(splTokenIn.mint, splTokenIn.decimals);
    const tokenOut = new Token(splTokenIn.mint, splTokenOut.decimals);
    const tokenAmountIn = new TokenAmount(tokenIn, amountIn, false);
    const amountOut = Liquidity.computeAmountOut({ poolInfo, poolKeys, amountIn: tokenAmountIn, currencyOut: tokenOut, slippage: new Percent(0, 100) });

    return amountOut;
}