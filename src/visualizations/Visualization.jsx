import React, { useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3";
import data from "../data/processedData.json";
import Dots from "./Dots";

const Visualization = () => {
  return (
    <Dots data={data} height={window.innerHeight} width={window.innerWidth} />
  );
};

export default Visualization;
