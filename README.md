
**Note**: Do not use, or even plan to use, this. I'm just explaining
some ideas I have and giving code to back it up. I don't plan on
marketing or fleshing out this repo at all.

[Demo page](https://jlongster.github.io/lively/)

This is an experiment to improve two things in React:

1. **The component interface** - avoid classes and embrace a more
functional way of defining components with state, lifecycles, and refs
2. **State exposure** - provide deeper tools to exploring state at runtime

This is born out of a lot of experience with React, and while working
on a new product I desired to avoid many minor frustrations that I've
experienced before. I have been using this in an existing product and
while it's still early, I've been loving it.

The biggest thing I want to avoid is classes. They are verbose,
error-prone, and hard to compose. Let me talk through that a little bit:

* It's annoying to have to choose between functions and classes. I'll
  often start with a functional component to design it and then
  "upgrade" to a class to have state. Rewriting it into a class is
  annoying, but not a huge deal. It's still mental burden and a single
  interface would be nice.

* Classes have the classic problem of having to bind functions to
  `this`. In React this happens most of the time with event callbacks.
  Do you do `this.onChange.bind(this)`, or use the static method
  pattern of `onChange = e => { ... }`? The former creates a new
  function each render (could be bad if wanting pure props), but the
  latter is creating a new function instance for every single
  component instance (could be bad for memory). For the latter
  pattern, I now have another choice to make: when writing functions
  which style do I use?

* I think the worst thing though is they aren't very composable. For
  example, let's say I have a utility function on my class:

```js
  getVideo(id, fromUser) {
    const video = this.state.videos[id];
    return {
      video,
      fromUser,
      type: 'mp4'
    }
  }
```

  This is fine, but then in `componentWillReceiveProps` I need to use
  this utility function because I need to process something. I can't!
  It's bound to the current state, but I need it to work with
  `nextState`. I could refactor it to take state in, but in a large
  scale I run into this all the time and end up wanting to pull out
  most of the code in my classes into functions (but then I have
  another thing to thing about: does this function belong on the class
  or not?)

This is what kickstarted this project; it's a new component interface
that is all functions. I started with my own thing, and then drew
inspiration from reason-react. What I had at first wasn't too
different; the main thing I stole was the `updater` idea.

## Component API

The entire implementation is in `lively.js` and you can see examples
in the `examples` folder.

Let's start with a functional component:

```js
function Input({ type }) {
  return <input type={type} />
}
```

Now let's add some state. That's where lively comes in. To "upgrade"
this all we need to do wrap it with lively and tweak the function signature:

```js
function onChange(bag, e) {
  return { value: e.target.value };
}

function getInitialState({ props }) {
  return { value: props.value || "" };
}
  
function Input({ props: { type }, state: { value }, updater }) {
  return <input type={type} value={value} onChange={updater(onChange)} />
}

export default lively(Input, { getInitialState });
```

To add lifecycle methods, you pass them in as the second arg to
`lively`. Here we added a `getInitialState` method. In the component,
we pull off the props and state separately, and add an `onChange` handler.

`updater` is a function that will take a function and turn it into a
callback for that component (it is **memoized** so given the same
args, it'll always return the same function instance which is great
for prop diffing). The new function will take a "component bag" (see the
`onChange` function) as the first arg, and any passed arguments after
it. The bag consist of these props:

* `inst` - The component instance (so you can have instance vars if needed)
* `props` - The props
* `state` - The state
* `refs` - Any refs

All lifecycle methods and callbacks are given this bag. In fact, the
render function itself is given this bag (so you could pull off refs
or inst too). `updater` is only available in the render function
though.

All updater methods and the `componentWillReceiveProps` hook update
the state by simply returning new state. You never manually call
`setState`. This is nice for several reasons: the confusing about what
is the current state goes away, and we can restrict when it can be
updated (can't ever call `setState` in `componentDidUpdate`).

See
[`Input.js`](https://github.com/jlongster/lively/blob/master/examples/src/Input.js)
and
[`Form.js`](https://github.com/jlongster/lively/blob/master/examples/src/Form.js)
in the examples folder for more examples, and see them running on the
demo page.

## State

My main goal is the component API, but since I'm making that I figured
I would explore some ideas for exposing component state to the user.

I really like component local state for transient state. But the
problem is it tends to be hidden away from the developer, and
difficult to build tooling around. I believe that's why initially
there was a push to everything in redux because it is nice to see
what's going on.

After thinking about my use cases a lot, I implemented the following:

* The ability to override the initial state from the outside. You
  would never want to do this in production, but it's *super* nice for
  documentation and other tooling. I currently have a large design
  system with an example page that renders all of my components in
  *all* of their states at once. Many of these components manage their
  own state (am I open? selected? etc) but I can override it to make a
  really powerful design system that I can hot reload and see changes
  across all states.

* The ability to record state as it changes. Originally I want to
  actually *host* the state outside of React. But after looking into
  it, it would be fighting against React hard, especially Fiber, and I
  don't see how it could play well.

For the second feature, it turned out OK that I don't host my own
state because I can't think of any real-world use case where I need
it. The ability to record it is good enough.

Note that all of this should be able to work in production mode, these
are not *just* debugging tools. Even if some of this functionality
isn't on by default in prod, I'd like to tell the user that they could
turn on a "verbose" mode and send me a recording if possible.

Check out the demos.
[Here is the override state demo](https://jlongster.github.io/lively/#override-state).
I'm able to force the autocomplete dropdown to be open.

The rest of them involve recording. The next one ([Log state](https://jlongster.github.io/lively/#log-state)) simply
logs the state in the devtools as it changes over time. This is
achieved by simply wrapping the subtree that I'm interested in with
the `Recorder` component:

[Recorder.js](https://github.com/jlongster/lively/blob/master/examples/src/Recorder.js)

```js
<Recorder>
  <Input value={5} />
</Recorder>
```

See `Recorder.js` for the implementation. It uses context to provide a
`recordState` function which lively component call when state changes.
The definition of that function is `recordState(inst, prevState)` (you
get the current state with `inst.state`).

Note that we are working with *subtrees*. You could argue that the
React devtools could do all of this. Usually I'm only really
interested in a small subtree though, and it's really nice to be able
to scope it.

The next demo ([Undo state](https://jlongster.github.io/lively/#undo-state)) shows how you can implement undo
functionality with this. Without the form knowing, you can enhance it
with undo functionality this this:

[Undo.js](https://github.com/jlongster/lively/blob/master/examples/src/Undo.js)

```js
function undo({ refs }) {
  refs.undo.undo();
}

// ... snip ...

<Undo ref={el => (refs.undo = el)}>
  <Form />
</Undo>
<button onClick={updater(undo)}>Undo</button>
```

See `Undo.js` for the details. I am well aware that this is probably
not practical in the real-world though, too many complications. (Since
we're not tracking the reconciled tree, this wouldn't actually work if
the tree changes).

The last demo ([View state](https://jlongster.github.io/lively/#view-state)) shows how you could display an inline
object inspector to show the state and props of a subtree. See the
`StateViewer.js` component for the implementation, and just like
before, it's as easy as wrapping a subtree:

[StateViewer.js](https://github.com/jlongster/lively/blob/master/examples/src/StateViewer.js)

```js
<StateViewer>
  <Form style={{ marginTop: 20 }} />
  Outside of the form: <Input name="outside" />
</StateViewer>
```

**Last note**: if you look at the components that implement state
recording, that have an instance and the state. What would be really
cool is if we could retroactively construct the tree that React has
reconciled, and be able to generated IDs for each node that encode
where they are in the tree. Then, we need a way to have this same
reconciled information when setting the initial state.

The result would be that we could actually snapshot React's state,
serialize it for later, and load it up. Give the same props & state,
we should be able to reconstruct the exact same UI.

I have no idea if that's possible, or even if there's a strong enough
use case for it. The main use case for all of the state stuff is
allowing a user to send me a detailed dump of what happened when they
hit an error. Anything to help with that is huge, and a simple
after-the-fact recording may be good enough.
