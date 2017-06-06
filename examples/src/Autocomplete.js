import React from "react";
import lively from "./lively";
import Input from "./Input";

function onOpen() {
  return { open: true };
}

function onClose() {
  return { open: false };
}

function Autocomplete({
  props: { value, textStyle, onEdit, style },
  state: { open },
  updater
}) {
  const item = {
    borderBottom: "1px solid #f0f0f0",
    padding: 5
  };

  return (
    <div
      style={{
        position: "relative",
        width: 200,
        ...style
      }}
      onClick={updater(onOpen)}
    >
      <Input
        defaultValue={value}
        style={{ width: "100%", ...textStyle }}
        onBlur={updater(onClose)}
      />

      {open &&
        <div
          style={{
            position: "absolute",
            left: -1,
            right: -1,
            height: 150,
            borderTop: 0,
            border: "1px solid #f0f0f0",
            backgroundColor: "white",
            zIndex: 100
          }}
        >
          <div style={item}>Virginia</div>
          <div style={item}>Maryland</div>
          <div style={item}>Georgia</div>
          <div style={item}>Tennessee</div>
        </div>}

    </div>
  );
}

export default lively(Autocomplete, {
  getInitialState() {
    return { open: false };
  }
});
