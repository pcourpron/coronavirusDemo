import React, { Component, useState, useEffect } from "react";
import firebase from "../../firebase";
import Fieldset from "../../components/fieldset";
import { useHistory } from "react-router-dom";
import * as _ from "lodash";
import axios from "axios";
import * as d3 from "d3";
import * as topojson from "topojson";
import "./dashboard.css";
import BarChart from "../../charts/barChart";
import { DualRing } from "react-awesome-spinners";
import styled from "styled-components";
import { TransitionGroup, CSSTransition } from "react-transition-group";

function Dashboard(props) {
  let { location } = props;
  let history = useHistory();
  let [loading, setLoading] = useState(true);
  let [statesData, setStatesData] = useState();
  let [us, setUS] = useState([]);
  let geoPath = d3.geoPath();
  var [statesDaily, setStatesDaily] = useState([]);
  let [lineData, setLineData] = useState([]);
  let [graphTitle, setGraphTitle] = useState("");
  let [dataType, setDataType] = useState("positive");
  let [stateSelected, changeState] = useState("CA");

  useEffect(function () {
    axios.get("https://d3js.org/us-10m.v1.json").then((res) => {
      let us = res.data;
      setUS(us);
    });

    axios.get("https://covidtracking.com/api/states/daily").then((res) => {
      let { data } = res;

      setStatesData(data);
      setDailyInfo(data);
    });
  }, []);

  useEffect(() => {
    if (Object.keys(statesDaily).length > 0) {
      setGraphData();
    }
  }, [statesDaily]);

  function setDailyInfo(data, dataType = "positive") {
    let states = [...new Set(data.map((day) => day.state))];
    let statesData = {};
    states.forEach((element) => {
      let filtered = data.filter((day) => day.state == element);

      let stateData = filtered.map((day) => {
        return {
          date: d3.timeParse("%Y%m%d")(day.date),
          y: day[dataType] || 0,
        };
      });

      statesData[element] = stateData;
    });
    setStatesDaily(statesData);
    setLoading(false);
  }

  function setGraphData(id = stateSelected) {
    setGraphTitle(statesAbbrev[id]);
    setLineData([...statesDaily[id]].reverse());
  }
  function generateStatePaths(geoPath, data) {
    const generate = () => {
      let states = _.map(data.geometries, (feature, i) => {
        let path = geoPath(topojson.feature(us, feature));
        let number = i;

        if (i < 10) number = "0" + i;
        let id = stateConversion[number];
        let filtered = statesData.filter((day) => day.state == id);
        let stateData = filtered.map((day) => {
          return {
            date: d3.timeParse("%Y%m%d")(day.date),
            y: day[dataType] || 0,
          };
        });
        let fill = "black";
        if (stateData.length > 0) {
          if (dataType == "positive") {
            fill = colorScalePositive(stateData[0].y);
          } else {
            fill = colorScaleDeath(stateData[0].y);
          }
        }

        return (
          <State
            path={path}
            key={i}
            id={id}
            onMouseEnter={() => {
              setGraphData(id);
            }}
            changeState={changeState}
            stateSelected={stateSelected}
            fill={fill}
          />
        );
      });
      return states;
    };

    let statePaths = generate();
    return statePaths;
  }
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
                Collecting Data...
              </p>
            </div>
          ) : (
            <div>
              <div>
                <button
                  className="signout"
                  onClick={() => {
                    firebase.auth().signOut();
                  }}
                >
                  Sign Out
                </button>
              </div>

              <h1 style={{ textAlign: "center" }}>COVID 19 Stats - USA</h1>
              <div style={{ paddingLeft: "50px" }}>
                {" "}
                <h3 className="datasetHeader">Pick a dataset</h3>
                <button
                  className={
                    dataType == "positive" ? "selected button" : "button"
                  }
                  onClick={() => {
                    setDataType("positive");
                    setDailyInfo(statesData, "positive");
                  }}
                >
                  Total Positive Cases
                </button>
                <button
                  className={
                    dataType !== "positive" ? "selected button" : "button"
                  }
                  onClick={() => {
                    setDataType("death");
                    setDailyInfo(statesData, "death");
                  }}
                >
                  Total Deaths
                </button>
              </div>
              <div style={{ paddingLeft: "60px" }}>
                <h3> Pick a state to see the data</h3>
                <svg width="500" height="50" style={{ marginLeft: "20px" }}>
                  {dataType == "positive"
                    ? domainPos.map((element, index) => {
                        return (
                          <g>
                            <rect
                              width="50"
                              height="20"
                              x={index * 50 + 20 + "px"}
                              style={{ fill: colorScalePositive(element) }}
                            ></rect>
                            <text y="50px" x={index * 50 + 10 + "px"}>
                              {element / 1000}k
                            </text>
                          </g>
                        );
                      })
                    : domainDeath.map((element, index) => {
                        return (
                          <g>
                            <rect
                              width="50"
                              height="20"
                              x={index * 50 + 20 + "px"}
                              style={{ fill: colorScaleDeath(element) }}
                            ></rect>
                            <text y="50px" x={index * 50 + 10 + "px"}>
                              {element / 1000}k
                            </text>
                          </g>
                        );
                      })}
                </svg>
              </div>
              <div className="dashboard">
                <div>
                  <svg
                    id="map-container"
                    viewBox="0 0 975 610"
                    style={{ margintop: "-30px" }}
                  >
                    {us.length == 0 ? null : (
                      <g
                        fill="none"
                        stroke="#000"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                      >
                        {generateStatePaths(geoPath, us.objects.states).map(
                          (element) => {
                            return element;
                          }
                        )}
                        />
                        <path
                          d={geoPath(topojson.feature(us, us.objects.nation))}
                        ></path>
                      </g>
                    )}
                  </svg>
                </div>
                <div>
                  <BarChart
                    type={dataType}
                    width={500}
                    height={300}
                    data={
                      lineData.length > 0
                        ? lineData
                        : Array.from(Array(80).keys()).map((value) => {
                            return { x: value, y: 0 };
                          })
                    }
                    title={graphTitle}
                  />
                </div>
              </div>
            </div>
          )}
        </CSSTransition>
      </TransitionGroup>
    </Wrapper>
  );
}

export default Dashboard;

const State = (props) => {
  return (
    <path
      onClick={props.onMouseEnter}
      onMouseDown={() => {
        props.changeState(props.id);
      }}
      id={props.id}
      className={
        props.stateSelected == props.id ? "states stateSelected" : "states"
      }
      d={props.path}
      fill={props.fill}
      stroke="#FFFFFF"
      strokeWidth={0.25}
    />
  );
};

let statesAbbrev = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

let stateConversion = {
  "00": "AR",
  "01": "CA",
  "02": "IL",
  "03": "KS",
  "04": "MS",
  "05": "OH",
  "06": "TX",
  "07": "AL",
  "08": "IA",
  "09": "LA",
  "10": "MN",
  "11": "MO",
  "12": "NE",
  "13": "AZ",
  "14": "CO",
  "15": "IN",
  "16": "MI",
  "17": "MT",
  "18": "NY",
  "19": "OR",
  "20": "VA",
  "21": "WY",
  "22": "NC",
  "23": "OK",
  "24": "TN",
  "25": "WI",
  "26": "AK",
  "27": "VT",
  "28": "ND",
  "29": "GA",
  "30": "ME",
  "31": "RE",
  "32": "WV",
  "33": "ID",
  "34": "SD",
  "35": "NM",
  "36": "WA",
  "37": "PA",
  "38": "FL",
  "39": "UT",
  "40": "KY",
  "41": "NH",
  "42": "SC",
  "43": "NV",
  "44": "HI",
  "45": "NJ",
  "46": "CT",
  "47": "MD",
  "48": "MA",
  "49": "DE",
  "50": "DC",
};

var domainPos = [0, 10000, 30000, 40000, 50000, 60000, 70000, 80000];

var colorScalePositive = d3
  .scaleThreshold()
  .domain(domainPos)
  .range(d3.schemeReds[9]);

var domainDeath = [0, 200, 500, 1000, 2000, 3000, 4000, 10000];
var colorScaleDeath = d3
  .scaleThreshold()
  .domain(domainDeath)
  .range(d3.schemeReds[9]);

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
