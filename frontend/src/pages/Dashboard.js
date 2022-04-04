import React from "react";
import HistoryPlot from "../components/historyPlot";
import Label from "../components/dashboard/label";

import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import database from "../firestore.config";

function Dashboard() {
	// Hooks for the pricing history plot
  const [pricingHistory, setPricingHistory] = React.useState([]);
  React.useEffect(() => {
		const pricingRef = collection(database, "pricing_history");
    const q = query(pricingRef, where("pool_id", "==", "ORCA_SOL_USDC_BUY"), orderBy("timestamp", "desc"), limit(100));
    onSnapshot(q, (querySnapshot) => {
      setPricingHistory(querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      })))
    })
  }, [setPricingHistory])

	return (
	<div className="dashboard">
		<div className="page-container">
		<h1>Dashboard</h1>
			<div className="widget-container row-centric">
				<Label
					name="Current Balance"
					detail="40,000 USDC"
					color="#64d3a3"
				/>
				<Label
					name="Earnings / Day"
					detail="0.0323 USDC"
					color="#6e8beb"
				/>
				<Label
					name="Transactions Performed"
					detail="555555"
					color="#a66eeb"
				/>
			</div>
			
			<div className="widget-container white-boxed graph">
				<HistoryPlot
					data={[
						{
							type: "scatter",
							mode: "lines+points",
							x: pricingHistory.map(ph => new Date(ph.data.timestamp.seconds * 1000)),
							y: pricingHistory.map(ph => ph.data.rate)
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
						detail="5"
						color="#a66eeb"
					/>
					<Label
						name="Profitable trades"
						detail="2"
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
