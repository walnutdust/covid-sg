import React from "react";
import data from "../data/processedData.json";
import Dots from "./Dots";

const Visualization = () => {
  return (
    <div>
      <Dots data={data} height={window.innerHeight} width={window.innerWidth} />
    </div>
  );
};

export default Visualization;
