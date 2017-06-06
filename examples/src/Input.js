import React from "react";
import lively from "./lively";

function onChange({ props }, e) {
  return { value: e.target.value };
}

function getInitialState({ props }) {
  if(!props.onChange) {
    return { value: props.defaultValue || "" };
  }
}

function Input({
  props,
  props: { type, style, onFocus, onBlur },
  state,
  updater
}) {
  return (
    <input
      type={type}
      value={props.onChange ? props.value : state.value}
      onChange={props.onChange || updater(onChange)}
      onFocus={onFocus}
      onBlur={onBlur}
      style={style}
      {...(type === "checkbox" ? { checked: props.checked } : null)}
    />
  );
}

export default lively(Input, { getInitialState });
