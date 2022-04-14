import React from "react";
import HistoryPlot from "../components/historyPlot";
import Label from "../components/dashboard/label";

import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import database from "../firestore.config";

import { Connection, PublicKey } from "@solana/web3.js";

function Dashboard() {
	const solanaWeb3Connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

	const [balance, setBalance] = React.useState(0);
	const [successfulTransactions, setSuccessfulTransactions] = React.useState([]);
	const [allTransactions, setAllTransactions] = React.useState([]);

	/**
	 * Using Solscan's API, given a wallet's public key and a token key to check,
	 * find all transactions about the token. Information gets stored
	 * inside "successfulTransactions".
	 * @param {string} walletPublicKey Wallet's public key
	 * @param {string} tokenKey Public key of target currency
	 * @param {number} newOffset Offset to used to query items in the API
	 */
	async function getPastTokenTransactions(walletPublicKey, tokenKey, newOffset=0) {
		let apiRequestParams = {
			address: walletPublicKey,
			USDCTokenAddress: tokenKey,
			offset: newOffset,
			limit: 10
		}

		let apiRequest = "https://api.solscan.io/account/token/txs?address=" + apiRequestParams.address + 
			"&token_address=" + apiRequestParams.USDCTokenAddress +
			"&offset=" + apiRequestParams.offset +
			"&limit=" + apiRequestParams.limit;

		let request = new XMLHttpRequest();
		request.open("GET", apiRequest);
		request.send();
		request.onload = function() {
			if (request.status === 200) {
				let response = JSON.parse(request.response)
				setSuccessfulTransactions(successfulTransactions => [...successfulTransactions, ...response.data.tx.transactions]);
				if (response.data.tx.hasNext) {
					getPastTokenTransactions(walletPublicKey, tokenKey, apiRequestParams.offset + 10);						
				}
			} else {
				console.log(`error ${request.status} ${request.statusText}`);
			}
		}
	}

	/**
	 * Get all transaction signatures tied to the user's wallet.
	 * @param {string} walletPublicKey User wallet's public key
	 */
	async function getSignaturesForAddressHelper(walletPublicKey) {
		// For solana web3
		const publicKey = new PublicKey(walletPublicKey);

		// Get past transactions
		let signatureParams = {
			limit: 1000,
			before: null
		}
		let query = await solanaWeb3Connection.getSignaturesForAddress(publicKey, signatureParams);
		let transactionSignatures = []

		while (query.length > 0) {
			Array.prototype.push.apply(transactionSignatures, query);
			signatureParams.before = query.at(query.length - 1).signature;
			query = await solanaWeb3Connection.getSignaturesForAddress(publicKey, signatureParams);
		}

		setAllTransactions(transactionSignatures);
	}

	/**
	 * Gets the balance of a token from a token account
	 * @param {string} tokenAccountPublicKey User's token account public key
	 */
	async function getTokenAccountBalanceHelper(tokenAccountKey) {
		const publicKey = new PublicKey(tokenAccountKey);
		const response = await solanaWeb3Connection.getTokenAccountBalance(publicKey);

		setBalance(response.value.amount / (10 ** response.value.decimals));
	}

	/**
	 * Gets all metrics to display on the dashboard.
	 * @param {string} walletPublicKey User wallet's public key
	 * @param {string} tokenAccountPublicKey User's token account public key
	 * @param {string} tokenKey Public key of target currency
	 */
	async function getWalletMetrics(walletPublicKey, tokenAccountPublicKey, tokenKey) {
		setBalance(0);
		setSuccessfulTransactions([]);
		setAllTransactions([]);

		getPastTokenTransactions(walletPublicKey, tokenKey);
		getSignaturesForAddressHelper(walletPublicKey);
		getTokenAccountBalanceHelper(tokenAccountPublicKey);
	}

	React.useEffect(() => {
		//8bH5MpK4A8J12sZo5HZTxYnrQpLV7jkxWzoTMwmWTWCH
		getWalletMetrics("DcdQUY7TAh5GSgTzoAEG5q6bZeVk95xFkJLqu4JHKa7z", "8bH5MpK4A8J12sZo5HZTxYnrQpLV7jkxWzoTMwmWTWCH", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
	}, [])

	return (
	<div className="dashboard">
		<div className="page-container">
		<h1>Dashboard</h1>
			<div className="widget-container row-centric">
				<Label
					name="Current Balance"
					detail={balance.toFixed(4) + " USDC"}
					color="#64d3a3"
				/>
				<Label
					name="Earnings / Day"
					detail="0.0323 USDC"
					color="#6e8beb"
				/>
				<Label
					name="Transactions Performed"
					detail={allTransactions.length}
					color="#a66eeb"
				/>
			</div>
			
			<div className="widget-container white-boxed graph">
				<HistoryPlot
					data={[
						{
							type: "scatter",
							mode: "lines+points",
							x: successfulTransactions.map(x => new Date(x.blockTime * 1000.0)),
							y: successfulTransactions.map(x => x.change.balance.amount / (10 ** x.change.balance.decimals))
						}
					]}
					layout = {
						{
							autosize: true,
							title: "Balance Over Time"
						}
					}
				/>
			</div>
		
		<h1>Bot Information</h1>
			<div className="widget-container col-centric bot-information">
				<div className="white-boxed graph fill">
					<HistoryPlot
						data={[
							{
								type: "scatter",
								mode: "lines+points",
								name: "Profit (USDC)",
								x: [0, 1, 2, 3, 4, 5],
								y: [0, 1, 2, 3, 4, 5]
							},
							{
								type: "bar",
								mode: "lines+points",
								name: "Transactions",
								x: [0, 1, 2, 3, 4, 5],
								y: [4, 2, 0, 5, 10, 2]
							}
						]}
						layout = {
							{
								//autosize: true,
								title: "Bot Information"
							}
						}
					/>
				</div>
				<div className="bot-text">
					<Label
						name="Current Strategy"
						detail="Simplest"
						color="#a66eeb"
					/>
					<Label
						name="Average Earnings"
						detail="0.001 USDC"
						color="#a66eeb"
					/>
					<Label
						name="AMMs"
						detail="Orca, Raydium"
						color="#a66eeb"
					/>
					<Label
						name="Currencies"
						detail="USDC, SOL, RAY, ORCA"
						color="#a66eeb"
					/>
					<Label
						name="Total transactions"
						detail={allTransactions.length}
						color="#a66eeb"
					/>
					<Label
						name="Profitable trades"
						detail={successfulTransactions.length}
						color="#a66eeb"
					/>
					<Label
						name="Total profit"
						detail="1.2 USDC"
						color="#a66eeb"
					/>
				</div>
			</div>
		</div>
	</div>)
}

export default Dashboard
