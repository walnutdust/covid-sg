import React, { useState, useLayoutEffect, useRef, useEffect } from "react";
import * as d3 from "d3";

const Dots = ({ data }) => {
  const [height, updateHeight] = useState(1000);
  const [width, updateWidth] = useState(1900);
  const [nodes, updateNodes] = useState([]);

  useLayoutEffect(() => {
    if (ref.current) {
      updateHeight(ref.current.clientHeight);
      updateWidth(ref.current.clientWidth);
    }
  }, [data]);

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
    updateNodes(dataNodes);
    simulate(dataNodes);
  }, [data, height, width]);

  const simulate = (dataNodes) => {
    const controlNode = {
      x: width / 2,
      y: height / 2,
    };

    const allNodes = [controlNode, ...dataNodes];
    const links = allNodes.map((_, i) => ({ source: i, target: 0 }));

    const simulation = d3.forceSimulation(allNodes);
    const gravity = d3.forceManyBody().strength((_, i) => (i === 0 ? 0 : -4));
    const linkForce = d3.forceLink(links).strength(0.2).distance(1);

    simulation.force("gravity", gravity).force("link", linkForce);

    simulation.alphaMin(0.1).velocityDecay(0.6);
    simulation.on("tick", () => updateNodes(nodes));
  };

  const ref = useRef(null);

  return (
    <svg width="100%" height="100%" ref={ref}>
      {nodes.map((n, i) => (
        <circle cx={n.x} cy={n.y} r={3} key={i} fill={n.fill} />
      ))}
    </svg>
  );
};

export default Dots;
