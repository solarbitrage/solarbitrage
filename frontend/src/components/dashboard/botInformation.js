import React from "react";
import Plot from "react-plotly.js";

class BotInformation extends React.Component {
    constructor(props) {
        super(props);
				
				this.name = "George"
        this.times = [];
        this.gains = [];
        this.strategyUsing = "default";
        this.averageEarnings = "-0.5%"
        this.amms = ["Raydium", "Orca"];
        this.currencies = ["USDC", "Solana"];
    }

    render() {
			return (
				<div className="bot">
					<h4>Bot {this.name}</h4>
					<div className="botInformation">
						<div className="botGraph">
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
								layout={ {width: 1280/2, height: 720/2, title: 'Earnings overtime'} }
							/>
						</div>

						<div className="botData">
							<p>Average Earnings: {this.averageEarnings}</p>
							<p>Current Strategy: {this.strategyUsing}</p>
							<p>AMMs: {this.amms}</p>
							<p>Currencies: {this.currencies}</p>
						</div>
					</div>
				</div>
        );
    }
}

export default BotInformation;
