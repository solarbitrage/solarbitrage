import React from 'react';
import Slider, { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';

class SliderWithValue extends React.Component {
  constructor(props) {
    super(props);

    this.myRef = React.createRef();

    this.state = {
      min: 0.0,
      max: 1.0,
      step: 0.01,
      value: 0,
    };
  }

  onSliderChange = value => {
    this.setState({ value });
  };

  render() {
    const labelStyle = { minWidth: '60px', display: 'inline-block' };
    return (
      <div ref={this.myRef}>
        <label style={labelStyle}>Value: </label>
        <span>{this.state.value}</span>
        <br />
        <br />
        <Slider
          value={this.state.value}
          min={this.state.min}
          max={this.state.max}
          step={this.state.step}
          onChange={this.onSliderChange}
        />
      </div>
    );
  }
}

export default SliderWithValue
