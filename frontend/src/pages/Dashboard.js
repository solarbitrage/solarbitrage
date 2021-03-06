import React from "react";
import axios from 'axios'
import HistoryPlot from "../components/historyPlot";
import Label from "../components/dashboard/label";
import Checkbox from "../components/checkbox";
import {Button, Table} from "react-bootstrap";
import { Link } from "react-router-dom";

import { getDatabase, ref, child, get, update } from "firebase/database";
import { Connection, PublicKey } from "@solana/web3.js";

function Dashboard() {

	const wallet = "DcdQUY7TAh5GSgTzoAEG5q6bZeVk95xFkJLqu4JHKa7z"

	// Time stuff
	const intervals = [
		{ label: 'year', seconds: 31536000 },
		{ label: 'month', seconds: 2592000 },
		{ label: 'day', seconds: 86400 },
		{ label: 'hour', seconds: 3600 },
		{ label: 'minute', seconds: 60 },
		{ label: 'second', seconds: 1 }
	];
	
	function timeSince(date) {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		const interval = intervals.find(i => i.seconds < seconds);
		const count = Math.floor(seconds / interval.seconds);
		return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
	}

	/**
	 * Paginates an array.
	 * @param {array} array array to paginate
	 * @param {number} pageSize size of data to display
	 * @param {number} page page number, the offset
	 * @returns 
	 */
	function arrayPagination(array, pageSize, page) {
		return array.slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize);
	}

	// Handler for deincrementing successful transactions
	function deincrementSuccPage() {
		if (succPageNumber > 1) {
			setSuccPageNumber(succPageNumber - 1);
		}
	}

	// Handler for incrementing successful transactions
	function incrementSuccPage() {
		if (!successfulTransactions || successfulTransactions.length <= 0 || succPageNumber < Math.ceil(successfulTransactions.length / 10)) {
			setSuccPageNumber(succPageNumber + 1);
		}
	}

	// Handler for deincrementing all transactions
	function deincrementAllPage() {
		if (allPageNumber > 1) {
			setAllPageNumber(allPageNumber - 1);
		}
	}

	// Handler for incrementing all transactions
	function incrementAllPage() {
		if (!allTransactions || allTransactions.length <= 0 || allPageNumber < Math.ceil(allTransactions.length / 10)) {
			setAllPageNumber(allPageNumber + 1);
		}
	}

	/**
	 * Retrieves the reason why a transaction failed.
	 * @param {string} transactionId txHash of a failed transaction.
	 * @returns 
	 */
	// 
	async function getFailedAmm(transactionId) {
		const url = "https://public-api.solscan.io/transaction/"+transactionId;
		const orcaIns = "8D7UaJcASNVK9m6wbJvRebPFn6kbfg5m2t4Vt8MpKxrL"  // orca program instruction
		const raydiumIns = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"  // raydium program instruction
		const orcaId = "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP"   
		const raydiumId = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
		let logArray;
		let res = await axios.get(url).then(function (res){
			let response = res.data;
			if(response.status==="Success"){
				return response.status;
			}
			else{
				logArray = response.logMessage  // what if transaction doesn't have log message
				// intra-Orca swap
				if(logArray[0].split(' ')[1] === orcaIns && logArray[6].split(' ')[1] === orcaIns){
					if(logArray.length <= 17){
						return "Failed at First Swap. AMM: Orca"
					}
					else{
						return "Failed at Second Swap. AMM: Orca"
					}
				}
				// intra-Raydium swap
				else if(logArray[0].split(' ')[1] === raydiumIns && logArray[4].split(' ')[1] === raydiumIns){
					if(logArray.length <= 13){
						return "Failed at First Swap. AMM: Raydium"
					}
					else{
						return "Failed at Second Swap. AMM: Raydium"
					}
				}
				// swaps always between raydium <-> orca
				// endAmm doesn't really mean that's the second AMM. It's just the last AMM instruction.
				let startAmm = logArray[10].split(' ')[1]
				let endAmm = logArray[logArray.length - 1].split(' ')[1]
				if(startAmm === orcaId && endAmm === orcaId){
					return "Failed at First Swap. AMM: Orca"
				}
				else if(startAmm === orcaId && endAmm === raydiumId){
					return "Failed at Second Swap. AMM: Raydium"
				}
				else if(startAmm === raydiumId && endAmm === raydiumId){
					return "Failed at First Swap. AMM: Raydium"
				}
				else if(startAmm === raydiumId && endAmm === orcaId){
					return "Failed at Second Swap. AMM: Orca"
				}
			}
		})
		return res
	}

	const [succPageNumber, setSuccPageNumber] = React.useState(1);
	const [allPageNumber, setAllPageNumber] = React.useState(1);
	const [disableAllPageNumberButtons, setDisableAllPageNumberButtons] = React.useState(true);

	const solanaWeb3Connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

	const [balance, setBalance] = React.useState(null);
	const [successfulTransactions, setSuccessfulTransactions] = React.useState(null);
	const [allTransactions, setAllTransactions] = React.useState(null);
	const [transactionStatuses, setTransactionStatuses] = React.useState({});
	const [allDisplayableTransactions, setAllDisplayableTransactions] = React.useState(null);

	// Currencies in the database right now.
	// const currencies = ["USDC", "BTC", "ETH", "LIQ", "ORCA", "SOL", "PORT", "RAY", "SBR", "SLRS", "SNY", "mSOL"];
	const [currencyCheckedState, setCurrencyCheckedState] = React.useState(new Array(0).fill(null));

	/**
	 * Using Solscan's API, given a wallet's public key and a token key to check,
	 * find all transactions about the token. Information gets stored
	 * inside "successfulTransactions".
	 * @param {string} walletPublicKey Wallet's public key
	 * @param {string} tokenKey Public key of target currency
	 * @param {number} newOffset Offset to used to query items in the API
	 */
	async function getPastTokenTransactions(walletPublicKey, tokenKey, newOffset=0, transactionArray=Array(0)) {
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

				transactionArray.push(...response.data.tx.transactions);

				if (response.data.tx.hasNext) {
					getPastTokenTransactions(walletPublicKey, tokenKey, apiRequestParams.offset + 10, transactionArray);						
				} else {
					setSuccessfulTransactions(transactionArray)
				}
			} else {
				console.log(`error ${request.status} ${request.statusText}`);
			}
		}
	}

	/**
	 * Gets 10 past transactions from solscan.
	 * @param {string} walletPublicKey Wallet's public key.
	 * @param {string} before txHash of previous transaction. Defaults no nothing.
	 * @param {array} transactionArray existing transaction array. Defaults to an array with the size of 0.
	 */
	async function getPastTransactions(walletPublicKey, before="", transactionArray=Array(0)) {
		let apiRequestParams = {
			address: walletPublicKey,
			lastTxHash: before
		}

		let apiRequest = "https://api.solscan.io/account/transaction?address=" + apiRequestParams.address +
			"&before=" + apiRequestParams.lastTxHash;

		let request = new XMLHttpRequest();
		request.open("GET", apiRequest);
		request.send();
		request.onload = async function() {
			if (request.status === 200) {
				let response = JSON.parse(request.response);
				transactionArray.push(...response.data);
        
				for (let i = 0; i < response.data.length; ++i) {
					getFailedAmm(transactionArray[transactionArray.length - response.data.length + i].txHash)
						.then(status => {
							const newTransactionStatuses = {};
							newTransactionStatuses[transactionArray[transactionArray.length - response.data.length + i].txHash] = status;
							setTransactionStatuses((oldVal) => ({...oldVal, ...newTransactionStatuses}));
						});
				}

				setAllDisplayableTransactions([...transactionArray]);
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

		getPastTransactions(walletPublicKey);
		getPastTokenTransactions(walletPublicKey, tokenKey);
		getSignaturesForAddressHelper(walletPublicKey);
		getTokenAccountBalanceHelper(tokenAccountPublicKey);
	}

	/**
	 * Calculated the USDC earnings for the past week.
	 * @param {array} transactions Array of transactions from solana web3
	 * @returns 
	 */
	function calculateEarningsPerWeek(transactions) {
		let oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 30);

		const transactionsPastWeek = transactions.filter(x => new Date(x.blockTime * 1000.0) > oneWeekAgo);

		const min = Math.min(...transactionsPastWeek.map(transaction => transaction.change.balance.amount / (10 ** transaction.change.balance.decimals)));
		const max = Math.max(...transactionsPastWeek.map(transaction => transaction.change.balance.amount / (10 ** transaction.change.balance.decimals)));

		// There were no trades in the past week
		if (max === -Infinity) {
			return 0.0;
		}

		return max - min;
	}

	/**
	 * Functions to fire once when the page loads.
	 */
	React.useEffect(() => {
		// Getting configurable variables from the real time database. 
		const realtimeDBRef = ref(getDatabase());
		get(child(realtimeDBRef, "currencies_to_use")).then((snapshot) => {
			if (snapshot.exists()) {
				let initialCurrenciesChecked = new Array(0);
				
				let i = 0;
				for (const currency in snapshot.val()) {
					initialCurrenciesChecked[i] = {
						currency: currency,
						enabled: snapshot.val()[currency]
					}
					++i;
				}
				setCurrencyCheckedState(initialCurrenciesChecked);
			} else {
				console.log("No data avaliable.");
			}
		}).catch((error) => {
			console.error(error);
		})

		getWalletMetrics(wallet, // Wallet Address
		"8bH5MpK4A8J12sZo5HZTxYnrQpLV7jkxWzoTMwmWTWCH", 	// Token Account Address
		"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");	// Token Address
	}, []);

	/**
   * Toggles the checkbox state of the currency filter.
   * @param {number} position the index of the checkbox of the currency filter. 
   */
	const handleCurrenciesCheckboxOnChange = (position) => {
    const updatedCurrencyCheckedState = currencyCheckedState.map((item, index) => {
			if (index === position) {
				item.enabled = !item.enabled
			}
      return item;
    })
    setCurrencyCheckedState(updatedCurrencyCheckedState);
  }

	/**
	 * Applys bot settings based on which checkboxes are checked in the front end.
	 */
	function applyBotSettings() {
		const db = getDatabase();

		const updates = {};
		for (let i = 0; i < currencyCheckedState.length; ++i) {
			updates["currencies_to_use/" + currencyCheckedState[i].currency] = currencyCheckedState[i].enabled;
		}

		update(ref(db), updates);
	}

	/**
	 * Disable or enable buttons while grabbing past transaction data from solscan
	 */

	React.useEffect(() => {
		if (allDisplayableTransactions !== null) {
			if (allPageNumber * 10 > allDisplayableTransactions.length + 1) {
				getPastTransactions(wallet, allDisplayableTransactions[allDisplayableTransactions.length - 1].txHash, allDisplayableTransactions);
				setDisableAllPageNumberButtons(true);
			} else {
				setDisableAllPageNumberButtons(false);
			}
		}
	}, [allPageNumber, allDisplayableTransactions]);

	React.useEffect(() => {

	}, [allPageNumber, allDisplayableTransactions]);

	return (
	<div className="dashboard">
		<div className="page-container">
			<div className="container">
				<h1>Dashboard</h1>
				<div className="widget-container row-centric zero-padding">
					<Label
						name="Current Balance"
						detail={balance ? balance.toFixed(4) + " USDC" : null}
						color="#2BDBA0"
					/>
					<Label
						name="Earnings / Month"
						detail={successfulTransactions ? calculateEarningsPerWeek(successfulTransactions).toFixed(4) + " USDC" : null} 
						color="#48B6C1"
					/>
					<Label
						name="Transactions Attempted"
						detail={allTransactions ? allTransactions.length : null}
						color="#8578DB"
					/>
					<Label
						name="Profitable trades"
						detail={successfulTransactions ? successfulTransactions.filter(transaction => transaction.change.changeAmount > 0 && transaction.blockTime >= 1649323165).length : null}
						color="#E26CFC"
					/>
				</div>
					
				<div className="widget-container white-boxed graph">
					<HistoryPlot
						data={[
							{
								type: "scatter",
								mode: "lines+points",
								x: successfulTransactions ? [new Date()].concat(successfulTransactions.map(x => new Date(x.blockTime * 1000.0))) : [],
								y: successfulTransactions ? [successfulTransactions[0].change.balance.amount / (10 ** successfulTransactions[0].change.balance.decimals)].concat(
									successfulTransactions.map(x => x.change.balance.amount / (10 ** x.change.balance.decimals))) : []
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

				<h1>Transaction History</h1>
				<div className="widget-container white-boxed col-centric">
				
				{/* All Transactions */}
				<h3>All Transactions</h3>
				<Table striped borderless hover size="sm">
						<thead>
							<tr>
								<th key="AllSignitureHeader">Signature</th>
								<th key="AllBlockHeader">Block</th>
								<th key="AllTimeHeader">Time</th>
								<th key="AllInstructionsHeader">Instructions</th>
								<th key="AllStatusHeader">Status</th>
								<th key="AllFee">Fee</th>
							</tr>
						</thead>
						<tbody>
							{
								allDisplayableTransactions !== null ?
									arrayPagination(allDisplayableTransactions, 10, allPageNumber).map((transaction, index) => {
										return (
											<tr key={transaction.txHash}>
												<td key={"AllSignitureKey" + index}>
													<Link to={"/tx/" + transaction.txHash} target="_blank" rel="noreferrer">
														{transaction.txHash.substring(0, 15) + "..."}
													</Link></td>
												<td key={"AllBlockKey" + index}>{"#" + transaction.slot}</td>
												<td key={"AllTimeKey" + index}>{timeSince(new Date(transaction.blockTime * 1000))}</td>
												<td key={"AllInstructionsKey" + index}>{transaction.parsedInstruction.map(instruction => instruction.type).join(", ")}</td>
												<td key={"AllStatus" + index} style={transactionStatuses[transaction.txHash]?.includes("fail") || transactionStatuses[transaction.txHash]?.includes("Fail") ? {color: "red"} : {color: "green"}}>{transactionStatuses[transaction.txHash]}</td>
												<td key={"AllFee" + index}>{transaction.fee * 0.000000001}</td>
											</tr>
										);
									})
								:
								[]
							}
						</tbody>
					</Table>
					<div className="table-page-control">
						<Button className="" variant="secondary" onClick={deincrementAllPage} disabled={disableAllPageNumberButtons}>{"<<"}</Button>
						{" " + allPageNumber + " of " + (allTransactions !== null ? Math.ceil(allTransactions.length / 10) : "?") + " "}
						<Button className="" variant="primary" onClick={incrementAllPage} disabled={disableAllPageNumberButtons}>{">>"}</Button>
					</div>

					{/* Successful Transactions */}
					<h3>Successful Transactions</h3>
					<Table striped borderless hover size="sm">
						<thead>
							<tr>
								<th key="SuccSignitureHeader">Signature</th>
								<th key="SuccBlockHeader">Block</th>
								<th key="SuccTimeHeader">Time</th>
								<th key="SuccTokenAccountHeader">Token Account</th>
								<th key="SuccChangeAmountHeader">Change Amount</th>
								<th key="SuccTokenHeader">Token</th>
							</tr>
						</thead>
						<tbody>
							{
								successfulTransactions !== null ? 
									arrayPagination(successfulTransactions, 10, succPageNumber).map((transaction, index) => {
										return (
											<tr>
												<td key={"SuccSignitureKey" + index}>
													<a href={"https://solscan.io/tx/" + transaction.txHash} target="_blank" rel="noreferrer">
														{transaction.txHash.substring(0, 15) + "..."}
													</a>
												</td>
												
												<td key={"SuccBlockKey" + index}>{"#" + transaction.slot}</td>
												<td key={"SuccTimeKey" + index}>{timeSince(new Date(transaction.blockTime * 1000))}</td>
												<td key={"SuccTokenAccountKey" + index}>{transaction.change.address.substring(0, 15) + "..."}</td>
												<td key={"SuccChangeAmountKey" + index} style={transaction.change.changeAmount >= 0 ? {color: "green"} : {color: "red"}}>
													{transaction.change.changeAmount / (10 ** transaction.change.decimals)}
												</td>
												<td key={"SuccTokenKey" + index}>{transaction.change.tokenName}</td>
											</tr>
										);
									})
								:
								[]
							}
						</tbody>
					</Table>
					<div className="table-page-control">
						<Button className="" variant="secondary" onClick={deincrementSuccPage}>{"<<"}</Button>
						{" " + succPageNumber + " of " + (successfulTransactions !== null ? Math.ceil(successfulTransactions.length / 10) : "?") + " "}
						<Button className="" variant="primary" onClick={incrementSuccPage}>{">>"}</Button>
					</div>
				</div>

				<h1>Bot Configurations</h1>
				<div className="widget-container white-boxed graph">
					<div className="currency-checkbox-container filter">
						<h3>Currencies</h3>
						{currencyCheckedState.map((entry, index) => {
							return (
								<Checkbox key={"CheckboxKey" + index} label={entry.currency} value={entry.enabled} onChange={() => handleCurrenciesCheckboxOnChange(index)} id={"currency-" + index} />
							);
						})}
					</div>
					<Button className="filter-apply-btn" variant="primary" onClick={applyBotSettings}>Apply</Button>
				</div>
			</div>
		</div>
	</div>)
}

export default Dashboard
