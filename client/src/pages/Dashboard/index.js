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
  let [populationAdjust, changePopAdjust] = useState(false);

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

  function setDailyInfo(
    data,
    dataType = "positive",
    populationAdjust = populationAdjust
  ) {
    let states = [...new Set(data.map((day) => day.state))];
    let statesData = {};

    states.forEach((element) => {
      let stateName = statesAbbrev[element];

      let population = statesInfo.filter(
        (state) => state["State"] == stateName
      )[0]
        ? statesInfo.filter((state) => state["State"] == stateName)[0].Pop
        : 1;
      let filtered = data.filter((day) => day.state == element);

      let stateData = filtered.map((day) => {
        let y = populationAdjust
          ? (day[dataType] / population) * 1000000
          : day[dataType];
        return {
          date: d3.timeParse("%Y%m%d")(day.date),
          y: y || 0,
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

        let fill = legends[dataType].scale(stateData[0] ? stateData[0].y : 0);

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

  function createLegend() {
    let stateName = statesAbbrev[stateSelected];
    let population = 1;
    if (populationAdjust) {
      population = statesInfo.filter((state) => state["State"] == stateName)[0]
        ? statesInfo.filter((state) => state["State"] == stateName)[0].Pop /
          1000000
        : 1;
    }

    return (
      <svg width="500" height="50" style={{ marginLeft: "20px" }}>
        {legends[dataType].legend.map((element, index) => {
          let text =
            element > 9000 ? `${element / 1000}k` : element / population;

          return (
            <g>
              <rect
                width="50"
                height="20"
                x={index * 50 + 20 + "px"}
                style={{ fill: legends[dataType].scale(element) }}
              ></rect>
              <text y="40px" x={index * 50 + 10 + "px"}>
                {text}
              </text>
            </g>
          );
        })}
      </svg>
    );
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
                    setDailyInfo(statesData, "positive", populationAdjust);
                  }}
                >
                  Total Positive Cases
                </button>
                <button
                  className={dataType == "death" ? "selected button" : "button"}
                  onClick={() => {
                    setDataType("death");
                    setDailyInfo(statesData, "death", populationAdjust);
                  }}
                >
                  Total Deaths
                </button>
                <button
                  className={
                    dataType == "deathIncrease" ? "selected button" : "button"
                  }
                  onClick={() => {
                    setDataType("deathIncrease");
                    setDailyInfo(statesData, "deathIncrease", populationAdjust);
                  }}
                >
                  Daily Death Rate
                </button>
              </div>
              <div style={{ paddingLeft: "60px" }}>
                <h3> Pick a state to see the data</h3>
                {createLegend()}
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
                        strokeLinejoin="round"
                        strokeLinecap="round"
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
                    populationAdjust={populationAdjust}
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

var domainPos = [0, 10000, 20000, 30000, 40000, 50000, 60000, 70000];
var domainDeath = [0, 500, 1000, 2000, 3000, 4000, 5000, 6000];
var domainDeathRate = [0, 10, 20, 30, 40, 50, 60, 70];

let legends = {
  positive: {
    legend: domainPos,
    scale: d3.scaleThreshold().domain(domainPos).range(d3.schemeReds[9]),
  },
  death: {
    legend: domainDeath,
    scale: d3.scaleThreshold().domain(domainDeath).range(d3.schemeReds[9]),
  },
  deathIncrease: {
    legend: domainDeathRate,
    scale: d3.scaleThreshold().domain(domainDeathRate).range(d3.schemeReds[9]),
  },
};

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

let statesInfo = [
  {
    rank: 1,
    State: "California",
    Pop: 39937489,
    Growth: "0.0096",
    Pop2018: 39557045,
    Pop2010: 37320903,
    growthSince2010: "0.0701",
    Percent: "0.1194",
    density: "256.3727",
  },
  {
    rank: 2,
    State: "Texas",
    Pop: 29472295,
    Growth: "0.0268",
    Pop2018: 28701845,
    Pop2010: 25242679,
    growthSince2010: "0.1676",
    Percent: "0.0881",
    density: "112.8204",
  },
  {
    rank: 3,
    State: "Florida",
    Pop: 21992985,
    Growth: "0.0326",
    Pop2018: 21299325,
    Pop2010: 18845785,
    growthSince2010: "0.1670",
    Percent: "0.0658",
    density: "410.1256",
  },
  {
    rank: 4,
    State: "New York",
    Pop: 19440469,
    Growth: "-0.0052",
    Pop2018: 19542209,
    Pop2010: 19400080,
    growthSince2010: "0.0021",
    Percent: "0.0581",
    density: "412.5211",
  },
  {
    rank: 5,
    State: "Pennsylvania",
    Pop: 12820878,
    Growth: "0.0011",
    Pop2018: 12807060,
    Pop2010: 12711158,
    growthSince2010: "0.0086",
    Percent: "0.0383",
    density: "286.5449",
  },
  {
    rank: 6,
    State: "Illinois",
    Pop: 12659682,
    Growth: "-0.0064",
    Pop2018: 12741080,
    Pop2010: 12840762,
    growthSince2010: "-0.0141",
    Percent: "0.0379",
    density: "228.0243",
  },
  {
    rank: 7,
    State: "Ohio",
    Pop: 11747694,
    Growth: "0.0050",
    Pop2018: 11689442,
    Pop2010: 11539327,
    growthSince2010: "0.0181",
    Percent: "0.0351",
    density: "287.5038",
  },
  {
    rank: 8,
    State: "Georgia",
    Pop: 10736059,
    Growth: "0.0206",
    Pop2018: 10519475,
    Pop2010: 9711810,
    growthSince2010: "0.1055",
    Percent: "0.0321",
    density: "186.6719",
  },
  {
    rank: 9,
    State: "North Carolina",
    Pop: 10611862,
    Growth: "0.0220",
    Pop2018: 10383620,
    Pop2010: 9574293,
    growthSince2010: "0.1084",
    Percent: "0.0317",
    density: "218.2702",
  },
  {
    rank: 10,
    State: "Michigan",
    Pop: 10045029,
    Growth: "0.0049",
    Pop2018: 9995915,
    Pop2010: 9877535,
    growthSince2010: "0.0170",
    Percent: "0.0300",
    density: "177.6655",
  },
  {
    rank: 11,
    State: "New Jersey",
    Pop: 8936574,
    Growth: "0.0031",
    Pop2018: 8908520,
    Pop2010: 8799624,
    growthSince2010: "0.0156",
    Percent: "0.0267",
    density: "1215.1991",
  },
  {
    rank: 12,
    State: "Virginia",
    Pop: 8626207,
    Growth: "0.0127",
    Pop2018: 8517685,
    Pop2010: 8023680,
    growthSince2010: "0.0751",
    Percent: "0.0258",
    density: "218.4403",
  },
  {
    rank: 13,
    State: "Washington",
    Pop: 7797095,
    Growth: "0.0347",
    Pop2018: 7535591,
    Pop2010: 6742902,
    growthSince2010: "0.1563",
    Percent: "0.0233",
    density: "117.3272",
  },
  {
    rank: 14,
    State: "Arizona",
    Pop: 7378494,
    Growth: "0.0288",
    Pop2018: 7171646,
    Pop2010: 6407774,
    growthSince2010: "0.1515",
    Percent: "0.0221",
    density: "64.9550",
  },
  {
    rank: 15,
    State: "Massachusetts",
    Pop: 6976597,
    Growth: "0.0108",
    Pop2018: 6902149,
    Pop2010: 6566431,
    growthSince2010: "0.0625",
    Percent: "0.0209",
    density: "894.4355",
  },
  {
    rank: 16,
    State: "Tennessee",
    Pop: 6897576,
    Growth: "0.0188",
    Pop2018: 6770010,
    Pop2010: 6355301,
    growthSince2010: "0.0853",
    Percent: "0.0206",
    density: "167.2748",
  },
  {
    rank: 17,
    State: "Indiana",
    Pop: 6745354,
    Growth: "0.0080",
    Pop2018: 6691878,
    Pop2010: 6490436,
    growthSince2010: "0.0393",
    Percent: "0.0202",
    density: "188.2810",
  },
  {
    rank: 18,
    State: "Missouri",
    Pop: 6169270,
    Growth: "0.0070",
    Pop2018: 6126452,
    Pop2010: 5995976,
    growthSince2010: "0.0289",
    Percent: "0.0185",
    density: "89.7453",
  },
  {
    rank: 19,
    State: "Maryland",
    Pop: 6083116,
    Growth: "0.0067",
    Pop2018: 6042718,
    Pop2010: 5788642,
    growthSince2010: "0.0509",
    Percent: "0.0182",
    density: "626.6731",
  },
  {
    rank: 20,
    State: "Wisconsin",
    Pop: 5851754,
    Growth: "0.0066",
    Pop2018: 5813568,
    Pop2010: 5690479,
    growthSince2010: "0.0283",
    Percent: "0.0175",
    density: "108.0497",
  },
  {
    rank: 21,
    State: "Colorado",
    Pop: 5845526,
    Growth: "0.0263",
    Pop2018: 5695564,
    Pop2010: 5048281,
    growthSince2010: "0.1579",
    Percent: "0.0175",
    density: "56.4011",
  },
  {
    rank: 22,
    State: "Minnesota",
    Pop: 5700671,
    Growth: "0.0159",
    Pop2018: 5611179,
    Pop2010: 5310843,
    growthSince2010: "0.0734",
    Percent: "0.0170",
    density: "71.5922",
  },
  {
    rank: 23,
    State: "South Carolina",
    Pop: 5210095,
    Growth: "0.0248",
    Pop2018: 5084127,
    Pop2010: 4635656,
    growthSince2010: "0.1239",
    Percent: "0.0156",
    density: "173.3174",
  },
  {
    rank: 24,
    State: "Alabama",
    Pop: 4908621,
    Growth: "0.0042",
    Pop2018: 4887871,
    Pop2010: 4785448,
    growthSince2010: "0.0257",
    Percent: "0.0147",
    density: "96.9221",
  },
  {
    rank: 25,
    State: "Louisiana",
    Pop: 4645184,
    Growth: "-0.0032",
    Pop2018: 4659978,
    Pop2010: 4544532,
    growthSince2010: "0.0221",
    Percent: "0.0139",
    density: "107.5175",
  },
  {
    rank: 26,
    State: "Kentucky",
    Pop: 4499692,
    Growth: "0.0070",
    Pop2018: 4468402,
    Pop2010: 4348200,
    growthSince2010: "0.0348",
    Percent: "0.0135",
    density: "113.9566",
  },
  {
    rank: 27,
    State: "Oregon",
    Pop: 4301089,
    Growth: "0.0263",
    Pop2018: 4190713,
    Pop2010: 3837532,
    growthSince2010: "0.1208",
    Percent: "0.0129",
    density: "44.8086",
  },
  {
    rank: 28,
    State: "Oklahoma",
    Pop: 3954821,
    Growth: "0.0030",
    Pop2018: 3943079,
    Pop2010: 3759632,
    growthSince2010: "0.0519",
    Percent: "0.0118",
    density: "57.6547",
  },
  {
    rank: 29,
    State: "Connecticut",
    Pop: 3563077,
    Growth: "-0.0027",
    Pop2018: 3572665,
    Pop2010: 3579125,
    growthSince2010: "-0.0045",
    Percent: "0.0107",
    density: "735.8689",
  },
  {
    rank: 30,
    State: "Utah",
    Pop: 3282115,
    Growth: "0.0383",
    Pop2018: 3161105,
    Pop2010: 2775334,
    growthSince2010: "0.1826",
    Percent: "0.0098",
    density: "39.9430",
  },
  {
    rank: 31,
    State: "Iowa",
    Pop: 3179849,
    Growth: "0.0075",
    Pop2018: 3156145,
    Pop2010: 3050767,
    growthSince2010: "0.0423",
    Percent: "0.0095",
    density: "56.9284",
  },
  {
    rank: 32,
    State: "Nevada",
    Pop: 3139658,
    Growth: "0.0347",
    Pop2018: 3034392,
    Pop2010: 2702464,
    growthSince2010: "0.1618",
    Percent: "0.0094",
    density: "28.5993",
  },
  {
    rank: 33,
    State: "Arkansas",
    Pop: 3038999,
    Growth: "0.0084",
    Pop2018: 3013825,
    Pop2010: 2921978,
    growthSince2010: "0.0400",
    Percent: "0.0091",
    density: "58.4030",
  },
  {
    rank: 34,
    State: "Puerto Rico",
    Pop: 3032165,
    Growth: "-0.0510",
    Pop2018: 3195153,
    Pop2010: 3721525,
    growthSince2010: "-0.1852",
    Percent: "0.0091",
    density: "876.6016",
  },
  {
    rank: 35,
    State: "Mississippi",
    Pop: 2989260,
    Growth: "0.0009",
    Pop2018: 2986530,
    Pop2010: 2970536,
    growthSince2010: "0.0063",
    Percent: "0.0089",
    density: "63.7056",
  },
  {
    rank: 36,
    State: "Kansas",
    Pop: 2910357,
    Growth: "-0.0004",
    Pop2018: 2911505,
    Pop2010: 2858213,
    growthSince2010: "0.0182",
    Percent: "0.0087",
    density: "35.5968",
  },
  {
    rank: 37,
    State: "New Mexico",
    Pop: 2096640,
    Growth: "0.0006",
    Pop2018: 2095428,
    Pop2010: 2064588,
    growthSince2010: "0.0155",
    Percent: "0.0063",
    density: "17.2850",
  },
  {
    rank: 38,
    State: "Nebraska",
    Pop: 1952570,
    Growth: "0.0121",
    Pop2018: 1929268,
    Pop2010: 1829536,
    growthSince2010: "0.0672",
    Percent: "0.0058",
    density: "25.4161",
  },
  {
    rank: 39,
    State: "Idaho",
    Pop: 1826156,
    Growth: "0.0410",
    Pop2018: 1754208,
    Pop2010: 1570773,
    growthSince2010: "0.1626",
    Percent: "0.0055",
    density: "22.0969",
  },
  {
    rank: 40,
    State: "West Virginia",
    Pop: 1778070,
    Growth: "-0.0154",
    Pop2018: 1805832,
    Pop2010: 1854214,
    growthSince2010: "-0.0411",
    Percent: "0.0053",
    density: "73.9691",
  },
  {
    rank: 41,
    State: "Hawaii",
    Pop: 1412687,
    Growth: "-0.0055",
    Pop2018: 1420491,
    Pop2010: 1363963,
    growthSince2010: "0.0357",
    Percent: "0.0042",
    density: "219.9419",
  },
  {
    rank: 42,
    State: "New Hampshire",
    Pop: 1371246,
    Growth: "0.0109",
    Pop2018: 1356458,
    Pop2010: 1316777,
    growthSince2010: "0.0414",
    Percent: "0.0041",
    density: "153.1605",
  },
  {
    rank: 43,
    State: "Maine",
    Pop: 1345790,
    Growth: "0.0055",
    Pop2018: 1338404,
    Pop2010: 1327632,
    growthSince2010: "0.0137",
    Percent: "0.0040",
    density: "43.6336",
  },
  {
    rank: 44,
    State: "Montana",
    Pop: 1086759,
    Growth: "0.0230",
    Pop2018: 1062305,
    Pop2010: 990722,
    growthSince2010: "0.0969",
    Percent: "0.0033",
    density: "7.4668",
  },
  {
    rank: 45,
    State: "Rhode Island",
    Pop: 1056161,
    Growth: "-0.0011",
    Pop2018: 1057315,
    Pop2010: 1053938,
    growthSince2010: "0.0021",
    Percent: "0.0032",
    density: "1021.4323",
  },
  {
    rank: 46,
    State: "Delaware",
    Pop: 982895,
    Growth: "0.0163",
    Pop2018: 967171,
    Pop2010: 899595,
    growthSince2010: "0.0926",
    Percent: "0.0029",
    density: "504.3073",
  },
  {
    rank: 47,
    State: "South Dakota",
    Pop: 903027,
    Growth: "0.0236",
    Pop2018: 882235,
    Pop2010: 816165,
    growthSince2010: "0.1064",
    Percent: "0.0027",
    density: "11.9116",
  },
  {
    rank: 48,
    State: "North Dakota",
    Pop: 761723,
    Growth: "0.0022",
    Pop2018: 760077,
    Pop2010: 674710,
    growthSince2010: "0.1290",
    Percent: "0.0023",
    density: "11.0393",
  },
  {
    rank: 49,
    State: "Alaska",
    Pop: 734002,
    Growth: "-0.0047",
    Pop2018: 737438,
    Pop2010: 713906,
    growthSince2010: "0.0281",
    Percent: "0.0022",
    density: "1.2863",
  },
  {
    rank: 50,
    State: "District of Columbia",
    Pop: 720687,
    Growth: "0.0260",
    Pop2018: 702455,
    Pop2010: 605085,
    growthSince2010: "0.1911",
    Percent: "0.0022",
    density: "11814.5410",
  },
  {
    rank: 51,
    State: "Vermont",
    Pop: 628061,
    Growth: "0.0028",
    Pop2018: 626299,
    Pop2010: 625880,
    growthSince2010: "0.0035",
    Percent: "0.0019",
    density: "68.1416",
  },
  {
    rank: 52,
    State: "Wyoming",
    Pop: 567025,
    Growth: "-0.0185",
    Pop2018: 577737,
    Pop2010: 564483,
    growthSince2010: "0.0045",
    Percent: "0.0017",
    density: "5.8400",
  },
];
