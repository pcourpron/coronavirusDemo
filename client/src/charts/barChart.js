import * as d3 from "d3";
import React, { useRef, useEffect } from "react";
import "./lineChart.css";
const margin = { top: 20, right: 20, bottom: 20, left: 50 };

function BarChart({ width, height, data, title, type }) {
  let xMax = data.length;
  let yMax = Math.max(...data.map((point) => point.y));
  const ref = useRef();
  var t = d3.transition().duration(500).ease(d3.easeLinear);
  const xScale = d3
    .scaleLinear()
    .range([0, width - margin.left - margin.right]);

  const yScale = d3
    .scaleLinear()
    .range([height - margin.top - margin.bottom, 0]);
  const line = d3
    .line()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.y))
    .curve(d3.curveMonotoneX);

  useEffect(() => {
    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height)
      .style("border", "1px solid black");
    draw();
  }, []);

  useEffect(() => {
    draw();
  }, [data]);

  const draw = () => {
    data = [...data];
    const svg = d3.select(ref.current);

    var xScale = d3
      .scaleLinear()
      .domain([0, xMax - 1]) // input
      .range([0, width]); // output

    // 6. Y scale will use the randomly generate number
    var yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1]) // input
      .range([height, 0]); // output
    const yAxis = d3.axisLeft().scale(yScale).ticks().tickSize(-width);

    const xAxis = d3.axisBottom().scale(xScale).ticks(10).tickSize(-height);

    var line = d3
      .line()
      .x(function (d, i) {
        return xScale(i);
      }) // set the x values for the line generator
      .y(function (d) {
        return yScale(d.y);
      }) // set the y values for the line generator
      .curve(d3.curveMonotoneX); // apply smoothing to the line

    if (!document.querySelector("svg:not(#map-container) .line")) {
      svg
        .append("path")
        .datum(data) // 10. Binds data to the line
        .attr("class", "line") // Assign a class for styling
        .attr("d", line);
    } else {
      svg
        .selectAll("path")
        .data(data)
        .append("path")
        .attr("class", "line") // Assign a class for styling
        .attr("d", line);
    }

    //AXIS
    if (svg.selectAll(".y.axis").empty()) {
      svg.append("g").attr("class", "y axis").call(yAxis);

      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x axis")
        .call(xAxis);
      svg
        .append("text")
        .attr("class", "xaxis label")
        .attr(
          "transform",
          "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
        )
        .style("text-anchor", "middle")
        .text("Date since first case");

      // text label for the y axis
      let yAxisLabel =
        type == "positive"
          ? "Total number of positive cases"
          : "Total number of deaths";
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("class", "yaxis label")
        .attr("y", 0 - margin.left - 20)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yAxisLabel);
    } else {
      let yAxisLabel =
        type == "positive"
          ? "Total number of positive cases"
          : "Total number of deaths";
      svg.selectAll(".y.axis").transition().duration(1000).call(yAxis);
      svg.selectAll(".x.axis").transition().duration(1000).call(xAxis);
      svg.selectAll(".yaxis.label").text(yAxisLabel);
    }

    svg.select(".line").transition(t).attr("d", line(data));

    svg.selectAll(".title").remove();
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("class", "title")
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(title);
  };

  return (
    <div className="chart">
      <svg ref={ref} className="lineChart"></svg>
    </div>
  );
}

export default BarChart;
