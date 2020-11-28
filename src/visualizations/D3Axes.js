import * as d3 from "d3";

// Draws the Axes via d3
const D3Axes = {
  drawAxes(xAxisRef, _, xScale) {
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => d);
    xAxis.ticks(d3.utcDay.every(1));
    xAxis.tickFormat(d3.timeFormat("%e"));

    xAxis(xAxisRef);
  },
};

export default D3Axes;
