import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaFarmConfig, OrcaPoolConfig, Network } from "@orca-so/sdk";
import { getDevnetPool } from "@orca-so/sdk/dist/public/devnet"
import Decimal from "decimal.js";

const main = async () => {
  /*** Setup ***/
  // 1. Read secret key file to get owner keypair
  // const secretKeyString = await readFile("/Users/scuba/my-wallet/my-keypair.json", {
  //   encoding: "utf8",
  // });
  // const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const secretKeyString = await readFile("/Users/noelb/my-solana-wallet/my-keypair.json", {
      encoding: "utf8",
    });
    // "8u6NTMzAiLkP9nFW9qWcoY8c9DrmKmfSxLYbHkBbkDyu"
    // "6VgdQS12EqfS31LkG9ksveqQQAJjiVbZ2F7rMzc8Cdec"
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const owner = Keypair.fromSecretKey(secretKey);

  // 2. Initialzie Orca object with mainnet connection
  // const connection = new Connection("https://api.mainnet-beta.solana.com", "singleGossip");
  // const orca = getOrca(connection);
  const connection = new Connection("https://api.devnet.solana.com", "singleGossip");
  const orca = getOrca(connection, Network.DEVNET);

  try {

    // // Getting USDC from SOL wallet
    // const solUSDCPool = orca.getPool(OrcaPoolConfig.SOL_USDC);
    // const orcaTokensell = solUSDCPool.getTokenA();
    // const orcaAmountsell = new Decimal(1);  // getting $1 0.01038672
    // const orcaquotesell = await solUSDCPool.getQuote(orcaTokensell, orcaAmountsell);
    // const USDCAmountbuy = orcaquotesell.getMinOutputAmount();
    
    // console.log(`Swapping dollass ${orcaAmountsell.toString()} SOL for at least ${USDCAmountbuy.toNumber()} USDC`);
    // const swap = await solUSDCPool.swap(owner, orcaTokensell, orcaAmountsell, USDCAmountbuy);
    // const swapId = await swap.execute();
    // console.log("\n swap id: ", swapId);
    // // Getting USDC from SOL wallet
    // const pools = [
    //   OrcaPoolConfig.ORCA_USDC,
    //   OrcaPoolConfig.SOL_USDC,
    //   OrcaPoolConfig.BTC_USDC,
    //   OrcaPoolConfig.ORCA_SOL
    // ]
    // const orcaUSDCPool = orca.getPool(OrcaPoolConfig.ORCA_USDC);
    // const USDCToken = orcaUSDCPool.getTokenB();
    // const USDCAmount = new Decimal(1);
    // const USDCquote = await orcaUSDCPool.getQuote(USDCToken, USDCAmount);
    // const USDCorcaAmount = USDCquote.getMinOutputAmount();

    // const orcaSolPool = orca.getPool(OrcaPoolConfig.ORCA_SOL);
    // const solToken = orcaSolPool.getTokenB();
    // const solAmount = new Decimal(0.1);
    // const solquote = await orcaSolPool.getQuote(solToken, solAmount);
    // const orcaAmount = solquote.getMinOutputAmount();


    /*** Swap ***/
    // 3. We will be swapping 0.1 SOL for some ORCA
    const orcaSolPool = orca.getPool(OrcaPoolConfig.ORCA_SOL);
    const solToken = orcaSolPool.getTokenB();
    const solAmount = new Decimal(0.1);
    const quote = await orcaSolPool.getQuote(solToken, solAmount);
    const orcaAmount = quote.getMinOutputAmount();

    console.log(`Swapertoto ${solAmount.toString()} SOL for at least ${orcaAmount.toNumber()} ORCA`);
    const swapPayload = await orcaSolPool.swap(owner, solToken, solAmount, orcaAmount);
    const swapTxId = await swapPayload.execute();

    console.log("Swapped:", swapTxId, "\n");

    // Getting USDC from ORCA from above
    const solUSDCPool = orca.getPool(OrcaPoolConfig.ORCA_USDC);
    const orcaTokensell = solUSDCPool.getTokenA();
    const orcaAmountsell = new Decimal(orcaAmount.toDecimal());  // getting $1 0.01038672
    const usdcQuote = await solUSDCPool.getQuote(orcaTokensell, orcaAmountsell);
    const USDCAmountbuy = usdcQuote.getMinOutputAmount();
    
    console.log(`Swapping ${orcaAmountsell.toString()} ORCA for at least ${USDCAmountbuy.toNumber()} USDC`);
    const swap2 = await solUSDCPool.swap(owner, orcaTokensell, orcaAmountsell, USDCAmountbuy);
    const swapId2 = await swap2.execute();
    console.log("\n swap id: ", swapId2);
    // Getting USDC from ORCA from above

    // Getting SOL from USDC from above
    // no matter what can't go from USDC -> SOL ...?
    // works for USDC <-> ORCA && SOL <-> ORCA
    // ----------- Getting ORCA from USDC -------------
    const orcaUSDCsellPool = orca.getPool(OrcaPoolConfig.ORCA_USDC);
    const usdcTokensell = orcaUSDCsellPool.getTokenB();
    const usdcAmountsell = new Decimal(0.0089);  // getting $1 0.01038672
    const orcaQuote = await orcaUSDCsellPool.getQuote(usdcTokensell, usdcAmountsell);
    const orcaAmountbuy = orcaQuote.getMinOutputAmount();
    
    console.log(`Swapping  ${usdcAmountsell.toString()} USDC for at least ${orcaAmountbuy.toNumber()} ORCA`);
    const swap3 = await orcaUSDCsellPool.swap(owner, usdcTokensell, usdcAmountsell, orcaAmountbuy);
    const swapId3 = await swap3.execute();
    console.log("\n swap id: ", swapId3);
    // ----------- Getting ORCA from USDC -------------

    // just trade based on timer interval
    // /*** Pool Deposit ***/
    // // 4. Deposit SOL and ORCA for LP token
    // const { maxTokenAIn, maxTokenBIn, minPoolTokenAmountOut } = await orcaSolPool.getDepositQuote(
    //   orcaAmount,
    //   solAmount
    // );
// haven't been able to work on it much. kinda busy with assignments 
    // console.log(
    //   `Deposit at most ${maxTokenBIn.toNumber()} SOL and ${maxTokenAIn.toNumber()} ORCA, for at least ${minPoolTokenAmountOut.toNumber()} LP tokens`
    // );
    // const poolDepositPayload = await orcaSolPool.deposit(
    //   owner,
    //   maxTokenAIn,
    //   maxTokenBIn,
    //   minPoolTokenAmountOut
    // );
    // const poolDepositTxId = await poolDepositPayload.execute();
    // console.log("Pool deposited:", poolDepositTxId, "\n");

    // /*** Farm Deposit ***/
    // // 5. Deposit some ORCA_SOL LP token for farm token
    // const lpBalance = await orcaSolPool.getLPBalance(owner.publicKey);
    // const orcaSolFarm = orca.getFarm(OrcaFarmConfig.ORCA_SOL_AQ);
    // const farmDepositPayload = await orcaSolFarm.deposit(owner, lpBalance);
    // const farmDepositTxId = await farmDepositPayload.execute();
    // console.log("Farm deposited:", farmDepositTxId, "\n");
    // // Note 1: for double dip, repeat step 5 but with the double dip farm
    // // Note 2: to harvest reward, orcaSolFarm.harvest(owner)
    // // Note 3: to get harvestable reward amount, orcaSolFarm.getHarvestableAmount(owner.publicKey)

    // /*** Farm Withdraw ***/
    // // 6. Withdraw ORCA_SOL LP token, in exchange for farm token
    // const farmBalance = await orcaSolFarm.getFarmBalance(owner.publicKey); // withdraw the entire balance
    // const farmWithdrawPayload = await orcaSolFarm.withdraw(owner, farmBalance);
    // const farmWithdrawTxId = await farmWithdrawPayload.execute();
    // console.log("Farm withdrawn:", farmWithdrawTxId, "\n");

    // /*** Pool Withdraw ***/
    // // 6. Withdraw SOL and ORCA, in exchange for ORCA_SOL LP token
    // const withdrawTokenAmount = await orcaSolPool.getLPBalance(owner.publicKey);
    // const withdrawTokenMint = orcaSolPool.getPoolTokenMint();
    // const { maxPoolTokenAmountIn, minTokenAOut, minTokenBOut } = await orcaSolPool.getWithdrawQuote(
    //   withdrawTokenAmount,
    //   withdrawTokenMint
    // );

    // console.log(
    //   `Withdraw at most ${maxPoolTokenAmountIn.toNumber()} ORCA_SOL LP token for at least ${minTokenAOut.toNumber()} ORCA and ${minTokenBOut.toNumber()} SOL`
    // );
    // const poolWithdrawPayload = await orcaSolPool.withdraw(
    //   owner,
    //   maxPoolTokenAmountIn,
    //   minTokenAOut,
    //   minTokenBOut
    // );
    // const poolWithdrawTxId = await poolWithdrawPayload.execute();
    // console.log("Pool withdrawn:", poolWithdrawTxId, "\n");
  } catch (err) {
    console.warn(err);
  }
};

main()
  .then(() => {
    console.log("Done");
  })
  .catch((e) => {
    console.error(e);
  });



// Rogan X
//   The code on the SDK readme does work, you just need to be really careful with how you're making the swaps. From an account with only SOL, you can swap from SOL -> ORCA, and then you'll be able to make swaps SOL -> ORCA -> USDC on devnet (the pool ratios are messed up and do not reflect mainnet prices, but the swap functionality works)
// To get it working, I had to start from a fresh project (yarn init -y and then yarn add @orca-so/sdk @solana/web3.js decimal - copy and paste the README code block, and then remove the mz/fs import and use a byte array private key instead).
// The devnet pools are different from the mainnet pools

// In case somebody runs in the same problem, it fixed itself by updating the orca package.