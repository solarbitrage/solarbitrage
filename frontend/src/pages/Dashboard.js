import React from "react";
import PriceHistoryPlot from "../components/dashboard/pricingHistoryPlot";
import BotInformation from "../components/dashboard/botInformation";

function Dashboard() {
  // const [pricingHistory, setPricingHistory] = useState([]);
  // useEffect(() => {
  //   const q = query(collection(database, "pricing_history")).orderByChild("timestamp").limitToFirst(50);
  //   onSnapshot(q, (querySnapshot) => {
  //     setPricingHistory(querySnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       data: doc.data()
  //     })))
  //   })
  // }, [])

	return (
	<div className="dashboard">
		<h1>Dashboard</h1>
		
		<div className="container">
			<div className="userInformation">
				<div className="userMetric">
					<h2>Current</h2>
					<h2>Insert Money Here</h2>
				</div>
				<div className="userMetric">
					<h2>Earnings / Day</h2>
					<h2>0.0323 USDC</h2>
				</div>
				<div className="userMetric">
					<h2>Bots running</h2>
					<h2>2/4</h2>
				</div>
			</div>

			<div className="earningsOverTimePlot">
				<PriceHistoryPlot 
					title="Monies over the time"
					times={[0, 1, 2, 3]} 
					prices={[0.5, 10, 20, 5]} />
			</div>
			
			<div className="botMetrics">
				<h2>Bots</h2>
				<BotInformation 
					name="George"
					strategyUsing="Sub Par"
					averageEarnings="-0.05%"
					amms={["Orca", "Raydium"]}
					currencies={["Solana", "USDC"]}
				/>
				<BotInformation
					name="Daniel"
					strategyUsing="The Best"
					averageEarnings="1000%"
					amms = {["Dan"]}
					currencies = {["Me"]}
				/>
				<BotInformation
					name="Ryan"
					strategyUsing="Something"
					averageEarnings="0%"
					amms = {["Dan"]}
					currencies = {["Me"]}
				/>
				<BotInformation
					name="Noel"
					strategyUsing="Abra"
					averageEarnings="Kadabra"
					amms = {["Doge"]}
					currencies = {["Coin"]}
				/>
			</div>
		</div>
	</div>)
}

export default Dashboard
