import React, { useRef, useLayoutEffect, useState } from "react";
import * as d3 from "d3";
import data from "../data/processedData.json";
import Dots from "./Dots";

const Visualization = () => {
  const [height, updateHeight] = useState(1000);
  const [width, updateWidth] = useState(1900);

  const ref = useRef(null);

  useLayoutEffect(() => {
    if (ref.current) {
      updateHeight(ref.current.clientHeight);
      updateWidth(ref.current.clientWidth);
    }
  }, []);

  return <Dots data={data} height={height} width={width} />;
};

export default Visualization;
