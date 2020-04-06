import React, { useRef } from 'react';
import * as d3 from 'd3';
import data from '../data/processedData.json';
import Dots from './Dots';

const Visualization = () => {
  const canvasRef = useRef(null);

  return <Dots data={data} />;
};

export default Visualization;
