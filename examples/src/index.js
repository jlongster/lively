import React from "react";
import ReactDOM from "react-dom";
import Input from "./Input";
import Autocomplete from "./Autocomplete";
import Form from "./Form";
import Recorder from "./Recorder";
import Undo from "./Undo";
import StateViewer from "./StateViewer";
import lively from "./lively";

function undo({ refs }) {
  refs.undo.undo();
}

const App = lively(function App({ refs, updater }) {
  return (
    <div>
      <h2 id="basic-inputs">Basic Inputs</h2>
      <p>
        This are simple and show the basic input. The autocomplete will show a dropdown when focused.
      </p>
      <Input defaultValue="basic example" />
      <Autocomplete value="autocompleted" />

      <h2 id="override-state">Override state</h2>
      <p>
        Externally supply an initial state to a component for exploration and documentation/style guides.
      </p>
      <div style={{ height: 220 }}>
        <pre>
          <code>
            {"<Autocomplete overrideInitialState={{ open: true }} />"}
          </code>
        </pre>
        <Autocomplete overrideInitialState={{ open: true }} />
      </div>

      <h2 id="log-state">Log state</h2>
      <p>
        Open devtools and type in the input to see how state changes.
      </p>
      <Recorder>
        <Input value={5} />
      </Recorder>

      <h2 id="undo-state">Undo state</h2>
      <p>
        Make changes to the form and press "undo" to undo them indefinitely.
      </p>
      <Undo ref={el => (refs.undo = el)}>
        <Form />
      </Undo>
      <button onClick={updater(undo)}>Undo</button>

      <h2 id="view-state">View state</h2>
      <p>
        The state is inspectable with an object inspector. Change the state and watch it update live.
      </p>
      <StateViewer>
        <Form style={{ marginTop: 20 }} />
        Outside of the form: <Input name="outside" />
      </StateViewer>
    </div>
  );
});

ReactDOM.render(<App />, document.querySelector("#root"));
