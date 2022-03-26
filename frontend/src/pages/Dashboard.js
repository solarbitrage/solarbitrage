import React from "react";
import PriceHistoryPlot from "../components/dashboard/pricingHistoryPlot";
import BotInformation from "../components/dashboard/botInformation";

import { Accordion } from "react-bootstrap";
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
			<div className="widget-container white-boxed row-centric">
				<div className="user-metric current-balance">
					<h5>Current</h5>
					<h3>40,000 USDC</h3>
				</div>
				<div className="user-metric earnings">
					<h5>Earnings / Day</h5>
					<h3>0.0323 USDC</h3>
				</div>
				<div className="user-metric transactions-performed">
					<h5>Transactions Performed</h5>
					<h3>555555</h3>
				</div>
			</div>
			
			<div className="widget-container white-boxed">
				<PriceHistoryPlot
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
			
			<div className="widget-container white-boxed">
				<div className="bot-metrics">
					<h2>Bots</h2>
					<Accordion defaultActiveKey={['0']} alwaysOpen>
						<Accordion.Item eventKey="0">
							<Accordion.Header>Bot 1</Accordion.Header>
							<Accordion.Body>
								<BotInformation 
									name="George"
									strategyUsing="Sub Par"
									averageEarnings="-0.05%"
									amms={["Orca", "Raydium"]}
									currencies={["Solana", "USDC"]}
								/>
							</Accordion.Body>
						</Accordion.Item>
						<Accordion.Item eventKey="1">
							<Accordion.Header>Bot 2</Accordion.Header>
							<Accordion.Body>
								<BotInformation
									name="Daniel"
									strategyUsing="The Best"
									averageEarnings="1000%"
									amms = {["Dan"]}
									currencies = {["Me"]}
								/>
							</Accordion.Body>
						</Accordion.Item>
						<Accordion.Item eventKey="2">
							<Accordion.Header>Bot 3</Accordion.Header>
							<Accordion.Body>
								<BotInformation
									name="Daniel"
									strategyUsing="The Best"
									averageEarnings="1000%"
									amms = {["Dan"]}
									currencies = {["Me"]}
								/>
							</Accordion.Body>
						</Accordion.Item>
						<Accordion.Item eventKey="3">
							<Accordion.Header>Bot 4</Accordion.Header>
							<Accordion.Body>
								<BotInformation
									name="Daniel"
									strategyUsing="The Best"
									averageEarnings="1000%"
									amms = {["Dan"]}
									currencies = {["Me"]}
								/>
							</Accordion.Body>
						</Accordion.Item>
					</Accordion>
				</div>
			</div>
		</div>
	</div>)
}

export default Dashboard
