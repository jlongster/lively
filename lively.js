import React from 'react';
import PropTypes from 'prop-types';

const lifecycleMethods = [
  'getInitialState',
  'componentDidMount',
  'componentWillUnmount',
  'componentWillReceiveProps',
  'componentDidUpdate',
  'shouldComponentUpdate'
];

function validateLifecycleMethods(componentName, methods) {
  Object.keys(methods).forEach(name => {
    if (lifecycleMethods.indexOf(name) === -1) {
      throw new Error(
        'Unknown lifecycle method in component ' + componentName + ': ' + name
      );
    }
  });
}

function makeBag(inst) {
  return {
    inst,
    props: inst.props,
    state: inst.state,
    refs: inst._refs,
    setState: inst._setState
  };
}

function arrayShallowEqual(x, y) {
  if (x.length === y.length) {
    for (var i = 0; i < x.length; i++) {
      if (x[i] !== y[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

const instCache = new Map();
function makeUpdater(inst) {
  return (func, ...staticArgs) => {
    let c = instCache.get(inst);
    if (c) {
      c = c.get(func);
      if (c) {
        if (staticArgs.length === 1) {
          let v = c.get(staticArgs[0]);
          if (v) {
            return v;
          }
        } else {
          for (let key of c.keys()) {
            if (arrayShallowEqual(key, staticArgs)) {
              return c.get(key);
            }
          }
        }
      }
    }

    const f = (...args) => {
      // TODO: This should be memoized so passing the same args in
      // always returns the exact same function instance (but with an
      // upper limit, like only memoize 20 at a time).

      const bag = makeBag(inst);
      const newState = func(bag, ...staticArgs, ...args);
      if (newState) {
        inst.setState(oldState => newState);
      }
    };

    if (!instCache.get(inst)) instCache.set(inst, new Map());
    c = instCache.get(inst);

    if (!c.get(func)) c.set(func, new Map());
    c = c.get(func);

    if (staticArgs.length === 1) {
      c.set(staticArgs[0], f);
    } else {
      c.set(staticArgs, f);
    }

    return f;
  };
}

function recordState(inst, context, prevState) {
  if (context.recordState) {
    return context.recordState(inst, prevState);
  }
}

function createComponent(component, lifecycleMethods = {}) {
  if (component.name === undefined) {
    throw new Error(
      'Component functions must always be given a name ' +
        '(see stack to check which anonymous function is the problem)'
    );
  }
  const name = component.name;
  validateLifecycleMethods(name, lifecycleMethods);

  class Wrapper extends React.Component {
    static displayName = name;
    static contextTypes = {
      recordState: PropTypes.func
    };

    constructor(props, context) {
      super(props);

      if (props.overrideInitialState !== undefined) {
        this.state = props.overrideInitialState;
      } else if (lifecycleMethods['getInitialState']) {
        this.state = lifecycleMethods['getInitialState']({
          inst: this,
          props
        });
      }

      if (this.state !== undefined) {
        recordState(this, context);
      }
      this._refs = {};
      this._updater = makeUpdater(this, this.context);
      this._setState = (state, onComplete) => {
        this.setState(oldState => state, onComplete);
      };
    }

    componentDidUpdate(prevProps, prevState) {
      if (lifecycleMethods['componentDidUpdate']) {
        const bag = makeBag(this);
        lifecycleMethods['componentDidUpdate'](bag, prevProps, prevState);
      }

      if (!this._loadingState && prevState !== this.state) {
        recordState(this, this.context, prevState);
      }
      this._loadingState = false;
    }

    loadState(state) {
      this._loadingState = true;
      this.setState(oldState => state);
    }

    render() {
      return component({
        inst: this,
        props: this.props,
        state: this.state,
        refs: this._refs,
        updater: this._updater,
        setState: this._setState
      });
    }
  }

  Object.keys(lifecycleMethods).forEach(name => {
    if (name !== 'getInitialState' && name !== 'componentDidUpdate') {
      Wrapper.prototype[name] = function(...args) {
        const bag = makeBag(this);
        if (name === 'shouldComponentUpdate') {
          return lifecycleMethods[name](bag, ...args);
        } else {
          const newState = lifecycleMethods[name](bag, ...args);
          // Only allow specific lifecycle hooks to update state
          if (name === 'componentWillReceiveProps') {
            if (newState) {
              this.setState(oldState => newState);
            }
          }
        }
      };
    }
  });

  return Wrapper;
}

export default function lively(component, lifecycleMethods) {
  return createComponent(component, lifecycleMethods);
}

export function scope(func) {
  return func(createComponent);
}
