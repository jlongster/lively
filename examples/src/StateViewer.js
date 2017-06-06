import React from "react";
import PropTypes from "prop-types";
import ObjectInspector from "react-inspector";

class StateViewer extends React.Component {
  static childContextTypes = {
    recordState: PropTypes.func
  };

  constructor() {
    super();
    this.state = { store: new Map() };
  }

  getChildContext() {
    return {
      recordState: this.recordState.bind(this)
    };
  }

  recordState(inst) {
    this.state.store.set(inst, inst.state);
    setTimeout(() => {
      this.setState({ store: this.state.store });
    });
  }

  render() {
    const state = {};
    [...this.state.store.entries()].forEach(([inst, s]) => {
      state[inst._reactInternalInstance._debugID] = {
        state: s,
        props: inst.props
      };
    });

    return (
      <div>
        {this.props.children}
        <div style={{ margin: 20 }}>
          <ObjectInspector data={state} expandLevel={1000} />
        </div>
      </div>
    );
  }
}

export default StateViewer;
