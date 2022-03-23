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
			<div ref={this.myRef} >
				<Plot
					data={this.state.data}
					layout={ this.props.layout }
				/>
			</div>
				
		);
	}
}

export default PriceHistoryPlot;
