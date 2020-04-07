import * as d3 from "d3";
const D3Axes = {
  drawAxes(xAxisRef, yAxisRef, xScale) {
    const xAxis = d3.axisBottom(xScale).tickFormat((d) => d);
    xAxis.ticks(d3.timeDay.every(1));
    xAxis.tickFormat(d3.timeFormat("%e"));

    xAxis(xAxisRef);
  },
};

export default D3Axes;
