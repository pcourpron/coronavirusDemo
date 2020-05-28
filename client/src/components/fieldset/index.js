import React, { Component, useState } from "react";
import "./fieldset.css";
function Fieldset(props) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <fieldset data-input={props.label}>
      <input
        id={props.label}
        name={props.label}
        type={
          props.label == "Password"
            ? showPassword
              ? "text"
              : "password"
            : "text"
        }
        onBlur={(event) => {
          inputOnBlur(event.target);
        }}
        value={props.value}
        onChange={(e) => {
          props.changeValue(e.target.value);
        }}
      />
      <label htmlFor={props.label}>{props.label}</label>
      {props.label == "Password" ? (
        <span
          className={
            showPassword ? "material-icons eye strike" : "material-icons eye"
          }
          onClick={() => {
            passwordEyeClick();
          }}
        >
          remove_red_eye
        </span>
      ) : null}
    </fieldset>
  );
  function passwordEyeClick() {
    setShowPassword(!showPassword);
  }
}
function inputOnBlur(input) {
  if (input.value !== "") {
    input.classList.add("has-val");
  } else {
    input.classList.remove("has-val");
  }
}

export default Fieldset;
