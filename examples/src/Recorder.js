import React from "react";
import PropTypes from "prop-types";

class Recorder extends React.Component {
  static childContextTypes = {
    recordState: PropTypes.func
  };

  getChildContext() {
    return {
      recordState: this.recordState.bind(this)
    };
  }

  recordState(inst, prevState) {
    console.log(inst.state);
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

export default Recorder;
