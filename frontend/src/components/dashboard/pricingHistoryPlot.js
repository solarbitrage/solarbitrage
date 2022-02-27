import React from "react";
import Plot from "react-plotly.js";

class PriceHistoryPlot extends React.Component {

	constructor(props) {
		super(props);

		this.title = "";
		this.times = [];
		this.prices = [];
	}

	render() {
		return (
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
				layout={ {width: 1280, height: 720, title: this.props.title} }
			/>
		);
	}
}

export default PriceHistoryPlot;
