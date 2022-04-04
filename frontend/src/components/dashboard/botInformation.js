import React from "react";
import Plot from "react-plotly.js";

class BotInformation extends React.Component {
	constructor(props) {
		super(props);
		
		this.name = ""
		this.times = [];
		this.gains = [];
		this.strategyUsing = "";
		this.averageEarnings = "-0.5%"
		this.amms = ["Raydium", "Orca"];
		this.currencies = ["USDC", "Solana"];
	}

	render() {
		return (
			<div className="bot">
				<h4>Bot {this.props.name}</h4>
				<div className="bot-information">
					<div className="bot-graph">
						<Plot
							data={[
									{
										x: this.props.times,
										y: this.props.prices,
										type: 'scatter',
										mode: 'lines+markers',
										marker: {color: 'red'},
									}
							]}
							layout={ {title: 'Earnings overtime'} }
							useResizeHandler={true}
							style={{width: "100%", height: "100%"}}
						/>
					</div>

					<div className="bot-data">
						<p>Current Strategy: {this.props.strategyUsing}</p>
						<p>Average Earnings: {this.props.averageEarnings}</p>
						<p>AMMs: {this.props.amms.join(", ")}</p>
						<p>Currencies: {this.props.currencies.join(", ")}</p>
					</div>
				</div>
			</div>
		);
	}
}

export default BotInformation;
