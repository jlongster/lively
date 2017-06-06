import React from "react";
import PropTypes from "prop-types";

const lifecycleMethods = [
  "getInitialState",
  "componentDidMount",
  "componentWillUnmount",
  "componentWillReceiveProps",
  "componentDidUpdate",
  "shouldComponentUpdate"
];

function validateLifecycleMethods(componentName, methods) {
  Object.keys(methods).forEach(name => {
    if (lifecycleMethods.indexOf(name) === -1) {
      throw new Error(
        "Unknown lifecycle method in component " + componentName + ": " + name
      );
    }
  });
}

function makeBag(inst) {
  return {
    inst,
    props: inst.props,
    state: inst.state,
    refs: inst._refs
  };
}

function makeUpdater(inst, context) {
  return (func, ...staticArgs) => (...args) => {
    const bag = makeBag(inst);
    const newState = func(bag, ...staticArgs, ...args);
    if (newState) {
      inst.setState(newState);
    }
  };
}

function recordState(inst, context, prevState) {
  if (context.recordState) {
    return context.recordState(inst, prevState);
  }
}

function createComponent(component, lifecycleMethods) {
  if (component.name === undefined) {
    throw new Error(
      "Component functions must always be given a name " +
        "(see stack to check which anonymous function is the problem)"
    );
  }
  const name = component.name;
  validateLifecycleMethods(name, lifecycleMethods);

  class Wrapper extends React.Component {
    displayName: name;
    static contextTypes = {
      recordState: PropTypes.func
    };

    constructor(props, context) {
      super(props);

      if (props.overrideInitialState !== undefined) {
        this.state = props.overrideInitialState;
      } else if (lifecycleMethods["getInitialState"]) {
        this.state = lifecycleMethods["getInitialState"]({
          inst: this,
          props
        });
      }

      if (this.state !== undefined) {
        recordState(this, context);
      }
      this._updater = makeUpdater(this, this.context);
    }

    componentDidUpdate(prevProps, prevState) {
      if (lifecycleMethods[name]) {
        const bag = makeBag(this);
        lifecycleMethods[name](bag, prevProps, prevState);
      }

      if (!this._loadingState && prevState !== this.state) {
        recordState(this, this.context, prevState);
      }
      this._loadingState = false;
    }

    loadState(state) {
      this._loadingState = true;
      this.setState(state);
    }

    render() {
      return component({
        inst: this,
        props: this.props,
        state: this.state,
        refs: this._refs,
        updater: this._updater
      });
    }
  }

  Object.keys(lifecycleMethods).forEach(name => {
    if (name !== "getInitialState" && name !== "componentDidUpdate") {
      Wrapper.prototype[name] = function(...args) {
        const bag = makeBag(this);
        const newState = lifecycleMethods[name](bag, ...args);
        // Only allow specific lifecycle hooks to update state
        if (name === "componentWillReceiveProps") {
          if (newState) {
            this.setState(newState);
          }
        }
      };
    }
  });

  return Wrapper;
}

export default function lively(componentOrFunction, lifecycleMethods) {
  if (lifecycleMethods === undefined) {
    const func = componentOrFunction;
    return func(createComponent);
  } else {
    const component = componentOrFunction;
    return createComponent(component, lifecycleMethods);
  }
}
