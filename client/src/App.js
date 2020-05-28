import firebase from "./firebase";
import React, { Component, useState, useEffect } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import "./App.css";
import { Switch, Route, withRouter } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import styled from "styled-components";
import { DualRing } from "react-awesome-spinners";

import { useHistory } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./pages/Dashboard";
function App({ location }) {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  const history = useHistory();
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);
  useEffect(function () {
    firebase.auth().onAuthStateChanged((user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        history.push("/dashboard");
      } else {
        setUser(null);
        history.push("/login");
      }
    });
  }, []);

  useEffect(
    function () {
      if (user === null || user) {
        setLoading(false);
      }
    },
    [user]
  );

  return (
    <Wrapper>
      <TransitionGroup>
        <CSSTransition
          key={location.key}
          classNames="fade"
          timeout={{ enter: 300, exit: 300 }}
        >
          {loading ? (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                height: "104px",
                width: "104px",
              }}
            >
              <DualRing size={104} sizeUnit={"px"} />
              <p style={{ whiteSpace: "nowrap", marginTop: "80px" }}>
                Connecting...
              </p>
            </div>
          ) : (
            <Switch location={location}>
              <Route path="/login" exact component={LoginPage}></Route>
              <PrivateRoute
                path="/dashboard"
                exact
                user={user}
                component={Dashboard}
              ></PrivateRoute>
            </Switch>
          )}
        </CSSTransition>
      </TransitionGroup>
    </Wrapper>
  );
}

export default withRouter(App);
const Wrapper = styled.div`
  .fade-enter {
    opacity: 0.01;
  }
  .fade-enter.fade-enter-active {
    opacity: 1;
    transition: opacity 300ms ease-in;
  }
  .fade-exit {
    opacity: 1;
  }

  .fade-exit.fade-exit-active {
    opacity: 0.01;
    transition: opacity 300ms ease-in;
  }
`;
