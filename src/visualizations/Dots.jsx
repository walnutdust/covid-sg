import React, { useState, useLayoutEffect, useRef, useEffect } from "react";
import * as d3 from "d3";
import _ from "lodash";
import d3ForceBounce from "d3-force-bounce";
import d3ForceSurface from "d3-force-surface";

const DOT_RADIUS = 3;

const Dots = ({ data, height, width }) => {
  const [nodes, updateNodes] = useState([]);
  const [disperse, toggleDisperse] = useState(false);

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
    console.log(dataNodes);
    updateNodes(dataNodes);
  }, [data]);

  const simulate = () => {
    const controlNode = {
      x: width / 2,
      y: height / 2,
    };
    console.log(nodes);
    const newNodes = _.cloneDeep(nodes);
    const allNodes = [controlNode, ...newNodes];
    const links = allNodes.map((_, i) => ({ source: i, target: 0 }));

    const simulation = d3.forceSimulation(allNodes);
    const gravity = d3.forceManyBody().strength((_, i) => (i === 0 ? 0 : -4));
    const linkForce = d3.forceLink(links).strength(0.2).distance(1);

    simulation.force("gravity", gravity).force("link", linkForce);

    simulation.alphaMin(0.5).velocityDecay(0.6);
    simulation.on("tick", () => updateNodes(newNodes));
  };

  const simulateBounce = () => {
    const newNodes = _.cloneDeep(nodes);

    newNodes.forEach((node) => {
      node.vx = (Math.random() - 0.5) * 15;
      node.vy = (Math.random() - 0.5) * 15;
    });

    const simulation = d3.forceSimulation(newNodes);
    simulation.force("bounce", d3ForceBounce().radius(DOT_RADIUS));
    simulation.force(
      "container",
      d3ForceSurface().surfaces([
        {
          from: { x: 0, y: 0 },
          to: { x: 0, y: height },
        },
        {
          from: { x: 0, y: 0 },
          to: { x: width, y: 0 },
        },
        {
          from: { x: 0, y: height },
          to: { x: width, y: height },
        },
        {
          from: { x: width, y: 0 },
          to: { x: width, y: height },
        },
      ])
    );
    simulation.velocityDecay(0);
    simulation.on("tick", () => {
      updateNodes(newNodes);
    });
  };

  const clickHandler = () => {
    console.log("D:");

    const newDisperse = !disperse;
    // if (newDisperse) {
    //   simulateBounce();
    // } else {
    //   simulate();
    // }
    toggleDisperse(newDisperse);
  };

  simulate();

  return (
    <svg width="100%" height="100%" onClick={() => clickHandler()}>
      {nodes.map((n, i) => (
        <circle cx={n.x} cy={n.y} r={DOT_RADIUS} key={i} fill={n.fill} />
      ))}
    </svg>
  );
};

export default Dots;
