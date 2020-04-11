import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import D3Dots from "./D3Dots";
import D3Axes from "./D3Axes";
import d3ForceBounce from "d3-force-bounce";
import d3ForceSurface from "d3-force-surface";
import singapore from "../data/singapore.json";

let simulation = null;

const STATES = {
  GRAPH: "GRAPH",
  BROWNIAN: "BROWNIAN",
  LINKS: "LINKS",
  CIRCLE: "CIRCLE",
  RADIAL: "RADIAL",
  SINGAPORE: "SINGAPORE",
};

// debug only, will be removed
const stateKeys = Object.keys(STATES);

const PADDING = 50;

const Dots = ({ data, height, width }) => {
  const [displayState, setDisplayState] = useState(STATES.SINGAPORE);

  const ref = useRef(null);
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);

  useEffect(() => {
    const dataNodes = data.map((d) => {
      const dist = (Math.random() * Math.min(height, width)) / 5;
      const locAngle = Math.random() * Math.PI * 2;
      let fillColor = "red";

      if (d.status === "Discharged") {
        fillColor = "green";
      } else if (d.status === "Deceased") {
        fillColor = "black";
      }

      d.x = Math.cos(locAngle) * dist + width / 2;
      d.y = Math.sin(locAngle) * dist + height / 2;
      d.fill = fillColor;
      d.dateConfirmed = new Date(d.dateConfirmed);

      return d;
    });

    singaporeBrownian(dataNodes);
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
      } else if (newDisplayState === STATES.RADIAL) {
        radialGraph(simulation.nodes());
      } else if (newDisplayState === STATES.LINKS) {
        linkGraph(simulation.nodes());
      } else if (newDisplayState === STATES.SINGAPORE) {
        singaporeBrownian(simulation.nodes());
      }
    }

    setDisplayState(newDisplayState);
  };

  const stopSimulation = () => {
    if (simulation) simulation.stop();
  };

  const simulateGather = (dataNodes) => {
    stopSimulation();

    simulation = d3.forceSimulation(dataNodes);
    const replusion = d3.forceManyBody().strength(-2);

    const yForce = d3
      .forceY()
      .y(height / 2)
      .strength(0.1);
    const xForce = d3
      .forceX()
      .x(width / 2)
      .strength(0.1);

    simulation.force("y", yForce).force("x", xForce);
    simulation.force("replusion", replusion);

    simulation.alphaMin(0.1).velocityDecay(0.4);
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

    simulation.alphaMin(0.005).velocityDecay(0.4);
    simulation.on("tick", () => forceTick(dataNodes, STATES.GRAPH));
  };

  const radialGraph = (dataNodes) => {
    stopSimulation();

    const radialScale = d3.scaleTime(
      d3.extent(dataNodes.map((d) => d.dateConfirmed)),
      [0, (height - PADDING) / 2]
    );

    simulation = d3.forceSimulation(dataNodes);

    const yForce = d3
      .forceY()
      .y(
        (node) =>
          radialScale(node.dateConfirmed) * Math.sin(node.angle) + height / 2
      );
    const xForce = d3
      .forceX()
      .x(
        (node) =>
          radialScale(node.dateConfirmed) * Math.cos(node.angle) + width / 2
      );

    simulation.force("x", xForce).force("y", yForce);

    simulation.alphaMin(0.1).velocityDecay(0.4);
    simulation.on("tick", () => forceTick(dataNodes, STATES.RADIAL));
  };

  const linkGraph = (dataNodes) => {
    stopSimulation();

    simulation = d3.forceSimulation(dataNodes);

    const xScale = d3.scaleTime(
      d3.extent(dataNodes.map((d) => d.dateConfirmed)),
      [PADDING, width - PADDING]
    );
    const yScale = d3.scaleLinear([0, 1000], [PADDING, height - PADDING]);

    const yForce = d3
      .forceY()
      .y((node) => (node.treeY ? yScale(node.treeY) : -PADDING));
    const xForce = d3.forceX().x((node) => xScale(node.dateConfirmed));

    simulation.force("x", xForce).force("y", yForce);

    D3Axes.drawAxes(
      d3.select(xAxisRef.current),
      d3.select(yAxisRef.current),
      xScale
    );

    simulation.alphaMin(0.01).velocityDecay(0.4);
    simulation.on("tick", () => {
      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);
      D3Dots.drawDots(context, dataNodes);
      D3Dots.drawHorizontalLinks(context, dataNodes);
    });
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

  const singaporeBrownian = (dataNodes) => {
    stopSimulation();
    dataNodes.forEach((node) => {
      node.vx = (Math.random() - 0.5) * 5;
      node.vy = (Math.random() - 0.5) * 5;
    });

    d3.select(xAxisRef.current).selectAll("*").remove();
    d3.select(yAxisRef.current).selectAll("*").remove();

    simulation = d3.forceSimulation(dataNodes);
    const yForce = d3.forceY().y(({ sgY }) => sgY);
    const xForce = d3.forceX().x(({ sgX }) => sgX);

    console.log(dataNodes[7]);

    simulation
      .force("x", xForce)
      .force("y", yForce)
      .alphaMin(0.01)
      .velocityDecay(0.4);
    simulation.on("tick", () => {
      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);
      D3Dots.drawDots(context, dataNodes);
    });
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
