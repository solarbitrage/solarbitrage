import React from "react";

class Label extends React.Component {
  constructor(props) {
		super(props);
		
		this.name = "Metric Title";
    this.detail = "Metric Detail";
    this.color = "#000000"
	}

  render() {
		return (
			<div className="label user-metric" style={{borderColor: this.props.color}}>
				<h5 style={{color: this.props.color}}>{this.props.name}</h5>
        <h3>{this.props.detail}</h3>
			</div>
		);
	}

}

export default Label;