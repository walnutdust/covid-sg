import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import D3Dots from "./D3Dots";
import D3Axes from "./D3Axes";
import d3ForceBounce from "d3-force-bounce";
import d3ForceSurface from "d3-force-surface";

let simulation = null;

const STATES = {
  BROWNIAN: "BROWNIAN",
  CIRCLE: "CIRCLE",
  GRAPH: "GRAPH",
};

// debug only, will be removed
const stateKeys = Object.keys(STATES);

const PADDING = 50;

const Dots = ({ data, height, width }) => {
  const [displayState, setDisplayState] = useState(STATES.CIRCLE);

  const ref = useRef(null);
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);

  useEffect(() => {
    const dataNodes = data.map(({ status, age, dateConfirmed, dayNo }) => {
      const dist = Math.random() * Math.min(height, width);
      const angle = Math.random() * Math.PI * 2;
      let fillColor = "red";

      if (status === "Discharged") {
        fillColor = "green";
      } else if (status === "Deceased") {
        fillColor = "black";
      }

      return {
        x: Math.cos(angle) * dist + width / 2,
        y: Math.sin(angle) * dist + height / 2,
        fill: fillColor,
        age,
        dateConfirmed: new Date(dateConfirmed),
        dayNo,
      };
    });

    simulateGather(dataNodes);
  }, [data, height, width]);

  const clickHandler = (e) => {
    e.preventDefault();

    const newDisplayState = Object.values(STATES)[
      (stateKeys.indexOf(displayState) + 1) % stateKeys.length
    ];

    if (simulation) {
      if (newDisplayState === STATES.BROWNIAN) {
        simulateBrownian(simulation.nodes());
      } else if (newDisplayState === STATES.GRAPH) {
        dailyGraph(simulation.nodes());
      } else if (newDisplayState === STATES.CIRCLE) {
        simulateGather(simulation.nodes());
      }
    }

    setDisplayState(newDisplayState);
  };

  const stopSimulation = () => {
    if (simulation) simulation.stop();
  };

  const simulateGather = (dataNodes) => {
    stopSimulation();

    const controlNode = {
      x: width / 2,
      y: height / 2,
    };
    const allNodes = [controlNode, ...dataNodes];
    const links = allNodes.map((_, i) => ({ source: i, target: 0 }));

    simulation = d3.forceSimulation(allNodes);
    const gravity = d3.forceManyBody().strength((_, i) => (i === 0 ? 0 : -4));
    const linkForce = d3.forceLink(links).strength(0.2).distance(1);

    simulation.force("gravity", gravity).force("link", linkForce);

    simulation.alphaMin(0.1).velocityDecay(0.6);
    simulation.on("tick", () => forceTick(dataNodes, STATES.CIRCLE));
  };

  const dailyGraph = (dataNodes) => {
    stopSimulation();

    const xScale = d3.scaleTime(
      d3.extent(dataNodes.map((d) => d.dateConfirmed)),
      [PADDING, width - PADDING]
    );

    simulation = d3.forceSimulation(dataNodes);
    const yForce = d3
      .forceY()
      .y((node, i) => height - PADDING - 8 * node.dayNo);
    const xForce = d3.forceX().x((node, i) => xScale(node.dateConfirmed));

    simulation.force("y", yForce).force("x", xForce);

    simulation.alphaMin(0.1).velocityDecay(0.4);
    simulation.on("tick", () => forceTick(dataNodes, STATES.GRAPH));
  };

  const simulateBrownian = (dataNodes) => {
    stopSimulation();
    dataNodes.forEach((node) => {
      node.vx = (Math.random() - 0.5) * 15;
      node.vy = (Math.random() - 0.5) * 15;
    });

    simulation = d3.forceSimulation(dataNodes);
    simulation.force("bounce", d3ForceBounce().radius(3));
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
    simulation.velocityDecay(0).alphaMin(0);
    simulation.on("tick", () => forceTick(dataNodes, STATES.BROWNIAN));
  };

  const forceTick = (dataNodes, currState) => {
    const context = ref.current.getContext("2d");

    context.clearRect(0, 0, width, height);
    D3Dots.drawDots(context, dataNodes);

    if (currState === STATES.GRAPH) {
      const xScale = d3.scaleUtc(
        d3.extent(dataNodes.map((d) => d.dateConfirmed)),
        [PADDING, width - PADDING]
      );

      D3Axes.drawAxes(
        d3.select(xAxisRef.current),
        d3.select(yAxisRef.current),
        xScale
      );
    } else {
      d3.select(xAxisRef.current).selectAll("*").remove();
      d3.select(yAxisRef.current).selectAll("*").remove();
    }
  };

  return (
    <>
      <svg style={{ width: "100%", height: "100%", position: "absolute" }}>
        <g ref={xAxisRef} transform={`translate(0,${height - PADDING})`} />
        <g ref={yAxisRef} transform={`translate(${PADDING},${PADDING})`} />
      </svg>
      <canvas
        width={width}
        height={height}
        onClick={(e) => clickHandler(e)}
        ref={ref}
        style={{ position: "absolute" }}
      />
    </>
  );
};

export default Dots;
