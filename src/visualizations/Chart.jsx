import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const Chart = ({ width, height }) => {
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);

  useEffect(() => {
    const xAxis = d3
      .axisBottom(d3.scaleLinear([0, 1], [0, 200]))
      .tickFormat((d) => d);
    const yAxis = d3
      .axisLeft(d3.scaleLinear([0, 1], [0, 200]))
      .tickFormat((d) => d);

    d3.select(xAxisRef.current).call(xAxis);
    d3.select(yAxisRef.current).call(yAxis);
  }, []);

  return (
    <svg>
      <g ref={xAxisRef} transform={`translate(0,${height - 20})`} />
      <g ref={yAxisRef} transform={`translate(${20},0)`} />
    </svg>
  );
};

export default Chart;
