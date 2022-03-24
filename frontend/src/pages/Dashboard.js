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
			<div className="user-stats">
				<div className="widget-container">
					<div className="user-metric">
						<h2>Current</h2>
						<h2>Insert Money Here</h2>
					</div>
					<div className="user-metric">
						<h2>Earnings / Day</h2>
						<h2>0.0323 USDC</h2>
					</div>
					<div className="user-metric">
						<h2>Bots running</h2>
						<h2>2/4</h2>
					</div>
				</div>
				
				<div className="widget-container">
					<div className="earnings-over-time-plot">
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
									width: 950, 
									height: 460, 
									title: "ORCA_SOL_USDC_BUY"
								}
							}
						/>
					</div>
				</div>
			</div>
			
			<div className="bot-stats">
				<div className="widget-container">
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
		</div>
	</div>)
}

export default Dashboard
