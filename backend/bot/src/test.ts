import { readFile } from "mz/fs";
import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaFarmConfig, OrcaPoolConfig, Network } from "@orca-so/sdk";
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
    // const solTokensell = solUSDCPool.getTokenA();
    // const solAmountsell = new Decimal(0.011139);  // getting $1
    // const solquotesell = await solUSDCPool.getQuote(solTokensell, solAmountsell);
    // const USDCAmountbuy = solquotesell.getMinOutputAmount();
    
    // console.log(`Swapertoto ${solAmountsell.toString()} SOL for at least ${USDCAmountbuy.toNumber()} USDC`);
    // const swap = await solUSDCPool.swap(owner, solTokensell, solAmountsell, USDCAmountbuy);
    // const swapped = await swap.execute();
    // console.log("\n swap id: ", swapped)
    // Getting USDC from SOL wallet


    const pools = [
      OrcaPoolConfig.ORCA_USDC,
      OrcaPoolConfig.SOL_USDC,
      OrcaPoolConfig.BTC_USDC,
      OrcaPoolConfig.ORCA_SOL
    ]
    const orcaUSDCPool = orca.getPool(OrcaPoolConfig.ORCA_USDC);
    const USDCToken = orcaUSDCPool.getTokenB();
    const USDCAmount = new Decimal(1);
    const USDCquote = await orcaUSDCPool.getQuote(USDCToken, USDCAmount);
    const USDCorcaAmount = USDCquote.getMinOutputAmount();

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

    // just trade based on timer interval
    // /*** Pool Deposit ***/
    // // 4. Deposit SOL and ORCA for LP token
    // const { maxTokenAIn, maxTokenBIn, minPoolTokenAmountOut } = await orcaSolPool.getDepositQuote(
    //   orcaAmount,
    //   solAmount
    // );

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