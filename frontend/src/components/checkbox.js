import React from "react";
import {Form} from "react-bootstrap";

class Checkbox extends React.Component {
  render() {
    return(
      <Form.Switch
        id={this.props.id}
        label={this.props.label}
        checked={this.props.value === null ? false : this.props.value}
        onChange={this.props.onChange}
        disabled={this.props.value === null ? true : false}
      />
    )
  }
}

export default Checkbox;