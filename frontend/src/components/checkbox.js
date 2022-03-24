import React from "react";

class Checkbox extends React.Component {
  render() {
    return(
      <div className="checkbox-container">
        <input type="checkbox" checked={this.props.value} onChange={this.props.onChange} />
        {this.props.label}
      </div>
    )
  }
}

export default Checkbox;