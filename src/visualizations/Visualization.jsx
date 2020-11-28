import React from "react";
import Dots from "./Dots";
import data from "../data/processedData.json";

const Visualization = () => {
  return (
    <div>
      <Dots data={data} height={window.innerHeight} width={window.innerWidth} />
    </div>
  );
};

export default Visualization;
