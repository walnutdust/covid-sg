import React, { useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3";
import data from "../data/processedData.json";
import Dots from "./Dots";
import Chart from "./Chart";

const Visualization = () => {
  return (
    <div>
      <Dots data={data} height={window.innerHeight} width={window.innerWidth} />
    </div>
  );
};

export default Visualization;
