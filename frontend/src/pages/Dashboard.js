import React from "react";
import HistoryPlot from "../components/historyPlot";
import Label from "../components/dashboard/label";

import { Connection, PublicKey } from "@solana/web3.js";

function Dashboard() {
	const solanaWeb3Connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

	const [balance, setBalance] = React.useState(null);
	const [successfulTransactions, setSuccessfulTransactions] = React.useState(null);
	const [allTransactions, setAllTransactions] = React.useState(null);

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

				// Check if this is the first of many queries
				if (newOffset === 0) {
					setSuccessfulTransactions(response.data.tx.transactions);
				} else {
					setSuccessfulTransactions(successfulTransactions => [...successfulTransactions, ...response.data.tx.transactions]);
				}
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
		setBalance(null);
		setSuccessfulTransactions(null);
		setAllTransactions(null);

		getPastTokenTransactions(walletPublicKey, tokenKey);
		getSignaturesForAddressHelper(walletPublicKey);
		getTokenAccountBalanceHelper(tokenAccountPublicKey);
	}

	React.useEffect(() => {
		getWalletMetrics("DcdQUY7TAh5GSgTzoAEG5q6bZeVk95xFkJLqu4JHKa7z", // Wallet Address
		"8bH5MpK4A8J12sZo5HZTxYnrQpLV7jkxWzoTMwmWTWCH", 	// Token Account Address
		"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");	// Token Address
	}, []);

	React.useEffect(() => {
		console.log(successfulTransactions);
	}, [successfulTransactions]);

	function calculateEarningsPerWeek(transactions) {
		let oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		const transactionsPastWeek = transactions.filter(x => new Date(x.blockTime * 1000.0) > oneWeekAgo);

		const min = Math.min(...transactionsPastWeek.map(transaction => transaction.change.balance.amount / (10 ** transaction.change.balance.decimals)));
		const max = Math.max(...transactionsPastWeek.map(transaction => transaction.change.balance.amount / (10 ** transaction.change.balance.decimals)));

		// There were no trades in the past week
		if (max === -Infinity) {
			return 0.0;
		}

		return max - min;
	}

	return (
	<div className="dashboard">
		<div className="page-container">
		<div className="container">
		<h1>Dashboard</h1>
		<div className="widget-container row-centric">
				<Label
					name="Current Balance"
					detail={balance ? balance.toFixed(4) + " USDC" : null}
					color="#64d3a3"
				/>
				<Label
					name="Earnings / Week"
					detail={successfulTransactions ? calculateEarningsPerWeek(successfulTransactions).toFixed(4) + " USDC" : null} 
					color="#6e8beb"
				/>
				<Label
					name="Transactions Attempted"
					detail={allTransactions ? allTransactions.length : null}
					color="#a66eeb"
				/>
				<Label
					name="Profitable trades"
					detail={successfulTransactions ? successfulTransactions.length : null}
					color="#a66eeb"
				/>
			</div>
			
			<div className="widget-container white-boxed graph">
				<HistoryPlot
					data={[
						{
							type: "scatter",
							mode: "lines+points",
							x: successfulTransactions ? successfulTransactions.map(x => new Date(x.blockTime * 1000.0)) : [],
							y: successfulTransactions ? successfulTransactions.map(x => x.change.balance.amount / (10 ** x.change.balance.decimals)) : []
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
		</div>						
		</div>
	</div>)
}

export default Dashboard
