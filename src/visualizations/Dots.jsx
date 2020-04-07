import React, { useState, useRef, useEffect } from "react";
import D3Dots from "./D3Dots";

const Dots = ({ data, height, width }) => {
  const [disperse, toggleDisperse] = useState(false);

  const ref = useRef(null);

  useEffect(() => {
    const dataNodes = data.map((d, i) => {
      const dist = Math.random() * Math.min(height, width);
      const angle = Math.random() * Math.PI * 2;
      let fillColor = "red";

      if (d.status === "Discharged") {
        fillColor = "green";
      } else if (d.status === "Deceased") {
        fillColor = "black";
      }

      return {
        x: Math.cos(angle) * dist + width / 2,
        y: Math.sin(angle) * dist + height / 2,
        fill: fillColor,
      };
    });

    D3Dots.initialize(ref.current.getContext("2d"), dataNodes);
    D3Dots.simulateGather();
  }, [data, height, width]);

  const clickHandler = (e) => {
    e.preventDefault();
    const newDispsersedState = !disperse;
    if (newDispsersedState) {
      D3Dots.simulateBrownian();
    } else {
      D3Dots.simulateGather();
    }
    toggleDisperse(newDispsersedState);
  };

  return (
    <canvas
      width={width}
      height={height}
      onClick={(e) => clickHandler(e)}
      ref={ref}
    />
  );
};

export default Dots;
