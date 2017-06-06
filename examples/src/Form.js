import React from "react";
import lively from "./lively";
import Input from "./Input";

function getInitialState() {
  return {
    input1: "hi1",
    input2: "hi2",
    input3: "hi3",
    input4: "hi4",
    input5: "hi5",
    checkbox1: true,
    checkbox2: false,
    checkbox3: true
  };
}

function onChange(_, name, e) {
  return {
    [name]: e.target.type === "checkbox" ? e.target.checked : e.target.value
  };
}

function Form({ props: { style }, state, updater }) {
  return (
    <div style={style}>
      <Input value={state.input1} onChange={updater(onChange, "input1")} />
      <Input value={state.input2} onChange={updater(onChange, "input2")} />
      <Input value={state.input3} onChange={updater(onChange, "input3")} />
      <Input value={state.input4} onChange={updater(onChange, "input4")} />
      <Input value={state.input5} onChange={updater(onChange, "input5")} />
      <Input
        type="checkbox"
        checked={state.checkbox1}
        onChange={updater(onChange, "checkbox1")}
      />
      Mozzarella
      <Input
        type="checkbox"
        checked={state.checkbox2}
        onChange={updater(onChange, "checkbox2")}
      />
      Parmesan
      <Input
        type="checkbox"
        checked={state.checkbox3}
        onChange={updater(onChange, "checkbox3")}
      />
      Basil
    </div>
  );
}

export default lively(Form, { getInitialState });
