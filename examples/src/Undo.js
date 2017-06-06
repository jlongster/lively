import React from "react";
import PropTypes from "prop-types";

class Undo extends React.Component {
  static childContextTypes = {
    recordState: PropTypes.func
  };

  constructor() {
    super();
    this.history = [];
  }

  getChildContext() {
    return {
      recordState: this.recordState.bind(this)
    };
  }

  undo() {
    if(this.history.length > 0) {
      const hist = this.history.pop();
      hist[0].loadState(hist[1]);
    }
  }

  recordState(inst, prevState) {
    if(prevState) {
      this.history.push([inst, prevState]);
    }
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

export default Undo;
