import React, { Component, useState } from "react";
import firebase from "../../firebase";
import "./loginPage.css";
import Fieldset from "../../components/fieldset";
import { useHistory } from "react-router-dom";

function LoginPage() {
  let history = useHistory();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState();

  return (
    <div className="loginPage">
      <div className="loginModal">
        <h3>{isLogin ? "Log in" : "Sign Up"}</h3>
        <form
          onSubmit={(event) => {
            formSubmit(event);
          }}
        >
          <Fieldset label="Email" value={email} changeValue={setEmail} />
          <Fieldset
            label="Password"
            value={password}
            changeValue={setPassword}
          />
          <button className="loginButton" type="submit">
            Login
          </button>
        </form>
        {error ? <div className="error loginError">{error}</div> : null}
        {isLogin ? (
          <div className="loginChangeContainer">
            Don't have an account?
            {
              <span
                className="loginChange"
                onClick={() => {
                  setIsLogin(!isLogin);
                }}
              >
                Sign up here!
              </span>
            }
          </div>
        ) : (
          <div className="loginChangeContainer">
            Already have an account?
            {
              <span
                className="loginChange"
                onClick={() => {
                  setIsLogin(!isLogin);
                }}
              >
                Log in Here!
              </span>
            }
          </div>
        )}
      </div>
    </div>
  );

  function formSubmit(event) {
    event.preventDefault();
    if (isLogin) {
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then((response) => {
          setError(null);
          history.push("/dashboard");
        })
        .catch((error) => {
          let { code, message } = error;
          if (
            code == "auth/email-already-in-use" ||
            code == "auth/invalid-email"
          ) {
            setError("Email is invalid");
          } else if (code == "auth/weak-password") {
            setError("Password is not strong enough");
          } else if (code == "auth/user-not-found") {
            setError("Email or Password is invalid");
          } else if (code == "auth/wrong-password") {
            if (password.length == 0) {
              setError("Please enter a password");
            } else {
              setError("Email or password is invalid");
            }
          } else {
            setError(message);
          }
        });
    } else {
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((response) => {
          setError(null);
          console.log(response);
          history.push("/dashboard");
        })
        .catch((error) => {
          let { code, message } = error;
          if (
            code == "auth/email-already-in-use" ||
            code == "auth/invalid-email" ||
            code == "auth/weak-password"
          ) {
            setError(message);
          }
        });
    }
  }
}

export default LoginPage;
