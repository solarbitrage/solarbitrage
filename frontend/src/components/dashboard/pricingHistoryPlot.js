import React from "react";
import Plot from "react-plotly.js";

class PriceHistoryPlot extends React.Component {
	constructor(props) {
		super(props);

		this.state = {data: this.props.data, layout: this.props.layout}
		this.myRef = React.createRef();
	}

	componentDidUpdate(prevProps, prevState) {
		if(prevProps.data !== this.props.data){
			this.setState({ 
				data: this.props.data, 
				layout: this.props.layout
			});
		}
	}

	render() {
		return (
				<Plot
					data={this.state.data}
					layout={ this.props.layout }
					useResizeHandler={true}
					style={{width: "100%", height: "100%"}}
				/>
		);
	}
}

export default PriceHistoryPlot;
