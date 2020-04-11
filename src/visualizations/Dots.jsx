import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import D3Dots from "./D3Dots";
import D3Axes from "./D3Axes";
import d3ForceSurface from "d3-force-surface";

// Simulate an enum for the various states
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

// Global variables
const PADDING = 50;
const DAY = 1000 * 24 * 60 * 60;
const WEEK = 7 * DAY;

const Dots = ({ data, height, width }) => {
  const [displayState, setDisplayState] = useState(STATES.SINGAPORE);
  const [nodes, setNodes] = useState([]);
  const [simulation, setSimulation] = useState(null);
  const [timer, setTimer] = useState(null);

  const ref = useRef(null);
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);

  // Re-initialize nodes everytime data, height, or width is changed.
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

      return d;
    });

    setNodes(dataNodes);
  }, [data, height, width]);

  useEffect(() => {
    if (displayState === STATES.BROWNIAN) {
      brownian();
    } else if (displayState === STATES.GRAPH) {
      dailyGraph();
    } else if (displayState === STATES.CIRCLE) {
      gatherNodes();
    } else if (displayState === STATES.RADIAL) {
      radialGraph();
    } else if (displayState === STATES.LINKS) {
      linkGraph();
    } else if (displayState === STATES.SINGAPORE) {
      singapore();
    }
  }, [displayState, nodes]);

  // Debug purposes, to toggle the states.
  const clickHandler = (e) => {
    e.preventDefault();

    const newDisplayState = Object.values(STATES)[
      (stateKeys.indexOf(displayState) + 1) % stateKeys.length
    ];

    setDisplayState(newDisplayState);
  };

  // Handles the reset of the state
  const resetState = () => {
    if (timer) timer.stop();
    if (simulation) simulation.stop();

    d3.select(xAxisRef.current).selectAll("*").remove();
    d3.select(yAxisRef.current).selectAll("*").remove();
  };

  // This is the state where all the nodes are gathered in a circle.
  // This is achieved with a force that gathers all the nodes to the center,
  // counter-balanced by a force that spreads them out.
  const gatherNodes = (dataNodes = nodes) => {
    resetState();
    const replusion = d3.forceManyBody().strength(-2);

    const yForce = d3
      .forceY()
      .y(height / 2)
      .strength(0.1);
    const xForce = d3
      .forceX()
      .x(width / 2)
      .strength(0.1);

    const sim = d3.forceSimulation(nodes);
    sim.force("y", yForce).force("x", xForce);
    sim.force("replusion", replusion);

    sim.alphaMin(0.1).velocityDecay(0.4);
    sim.on("tick", () => {
      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);
      D3Dots.drawDots(context, dataNodes);
    });

    setSimulation(sim);
  };
  // Graph of the daily numbers, sorted by their ids
  // TODO: might consider using animations rather than force?
  const dailyGraph = (dataNodes = nodes) => {
    resetState();

    const xScale = d3.scaleTime(
      d3.extent(dataNodes.map((d) => d.dateConfirmed)),
      [PADDING, width - PADDING]
    );
    const yScale = d3.scaleLinear(d3.extent(dataNodes.map((d) => d.dayNo)), [
      height - PADDING,
      PADDING,
    ]);

    const yForce = d3.forceY().y(({ dayNo }) => yScale(dayNo));
    const xForce = d3.forceX().x(({ dateConfirmed }) => xScale(dateConfirmed));

    const sim = d3.forceSimulation(nodes);

    sim.force("y", yForce).force("x", xForce);
    sim.alphaMin(0.005).velocityDecay(0.4);
    sim.on("tick", () => {
      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);
      D3Axes.drawAxes(
        d3.select(xAxisRef.current),
        d3.select(yAxisRef.current),
        xScale
      );
      D3Dots.drawDots(context, dataNodes);
    });

    setSimulation(sim);
  };

  // Radial graph of cases, with each band representing a week.
  // Utility wise may not be the best, since it takes up a lot of space,
  // but could be a powerful addition.
  const radialGraph = (dataNodes = nodes) => {
    resetState();

    const [firstDay, lastDay] = d3.extent(
      dataNodes.map((d) => d.dateConfirmed)
    );

    const weeks = new Array(Math.ceil((lastDay - firstDay) / WEEK));

    // 1. Calculate the # of the case in that particular week, assign it the angle
    // Skip if it was already set
    if (!dataNodes[0].week) {
      dataNodes.forEach((d) => {
        const index = Math.floor((d.dateConfirmed - firstDay) / WEEK);
        d.week = index;
        d.weekNo = (weeks[index] || 0) + 1;
        weeks[index] = d.weekNo;
      });

      dataNodes.forEach((d) => {
        d.weekAngle = (d.weekNo / weeks[d.week]) * 2 * Math.PI;
      });
      console.log(weeks);
    }

    // 2. Plot using the angle above

    const rScale = d3.scaleTime(
      [0, weeks.length - 1],
      // The 15 serves as a padding so the cases in the first week will not be clustered
      [15, (height - 2 * PADDING) / 2]
    );

    const ANIMATION_SPAN = 500;

    // Set the starting parameters
    dataNodes.forEach((node) => {
      node.startX = node.x;
      node.startY = node.y;
      node.targetX = rScale(node.week) * Math.cos(node.weekAngle) + width / 2;
      node.targetY = rScale(node.week) * Math.sin(node.weekAngle) + height / 2;
    });

    const newTimer = d3.timer((elapsed) => {
      dataNodes.forEach((node) => {
        let ratio = elapsed / ANIMATION_SPAN;
        if (ratio > 1) ratio = 1;

        node.x = (node.targetX - node.startX) * ratio + node.startX;
        node.y = (node.targetY - node.startY) * ratio + node.startY;
      });

      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);

      weeks.forEach((_, i) => {
        context.beginPath();
        context.ellipse(
          width / 2,
          height / 2,
          rScale(weeks.length - i - 0.5),
          rScale(weeks.length - i - 0.5),
          0,
          0,
          2 * Math.PI
        );
        i % 2 === 0
          ? (context.fillStyle = "#eeeeee") // Fill the odd rings to highlight the weeks
          : (context.fillStyle = "white");
        context.fill();
      });
      D3Dots.drawDots(context, dataNodes);

      if (elapsed > ANIMATION_SPAN) newTimer.stop();
    });

    setTimer(newTimer);
  };

  // Graph to show the links between different cases, as plotted against time.
  // The data here is pre-processed in process.js, and is plotted as a d3.tree()
  // with invisible nodes.
  // Unfortunately the resulting graph appears very cramped, and will likely be so,
  // and most links are not very useful anyways. Still, the manipulation used to
  // get to this point was interesting.
  const linkGraph = (dataNodes = nodes) => {
    resetState();

    const xScale = d3.scaleTime(
      d3.extent(dataNodes.map((d) => d.dateConfirmed)),
      [PADDING, width - PADDING]
    );
    const yScale = d3.scaleLinear([0, 1000], [PADDING, height - PADDING]);

    const yForce = d3
      .forceY()
      .y((node) => (node.treeY ? yScale(node.treeY) : -PADDING));
    const xForce = d3.forceX().x((node) => xScale(node.dateConfirmed));

    D3Axes.drawAxes(
      d3.select(xAxisRef.current),
      d3.select(yAxisRef.current),
      xScale
    );

    const sim = d3.forceSimulation(nodes);
    sim.force("x", xForce).force("y", yForce);
    sim.alphaMin(0.01).velocityDecay(0.4);
    sim.on("tick", () => {
      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);
      D3Dots.drawDots(context, dataNodes);
      D3Dots.drawHorizontalLinks(context, dataNodes);
    });
    setSimulation(sim);
  };

  // Simulation of brownian motion. The idea behind this was to give a visual
  // sense of people moving around and infecting people, or to highlight sheer
  // numbers.
  const brownian = (dataNodes = nodes) => {
    resetState();
    dataNodes.forEach((node) => {
      node.vx = (Math.random() - 0.5) * 5;
      node.vy = (Math.random() - 0.5) * 5;
    });

    const sim = d3.forceSimulation(nodes);
    // Could use a d3-force-bounce here. Opted to remove it as it was draining
    // on the resources.
    sim.force(
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
    sim.velocityDecay(0).alphaMin(0);
    sim.on("tick", () => {
      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);
      D3Dots.drawDots(context, dataNodes);
    });
    setSimulation(sim);
  };

  // The inspiration here was originally to use brownian motion in a Singapore
  // map container to demonstrate people moving about in Singapore. Unfortunately
  // this proved too computationally intensive, and the current function was
  // repurposed to animate the dots into pre-computed positions to form the
  // silhouette of Singapore.
  const singapore = (dataNodes = nodes) => {
    resetState();

    const ANIMATION_SPAN = 300; // Animation span in ms

    // sgX and sgY were pre-computed in process.js
    const heightExtent = d3.extent(dataNodes.map((d) => d.sgY));
    const widthExtent = d3.extent(dataNodes.map((d) => d.sgX));

    // get the height and width of the silhouette.
    const heightSg = heightExtent[1] - heightExtent[0];
    const widthSg = widthExtent[1] - widthExtent[0];

    const scale = Math.min(
      (height - 2 * PADDING) / heightSg,
      (width - 2 * PADDING) / widthSg
    );

    const xOffset = (width - widthSg * scale) / 2;
    const yOffset = (height - heightSg * scale) / 2;

    // Set the starting parameters
    dataNodes.forEach((node) => {
      node.startX = node.x;
      node.startY = node.y;
      node.targetX = node.sgX * scale + xOffset;
      node.targetY = node.sgY * scale + yOffset;
    });

    const newTimer = d3.timer((elapsed) => {
      dataNodes.forEach((node) => {
        let ratio = elapsed / ANIMATION_SPAN;
        if (ratio > 1) ratio = 1;

        node.x = (node.targetX - node.startX) * ratio + node.startX;
        node.y = (node.targetY - node.startY) * ratio + node.startY;
      });

      const context = ref.current.getContext("2d");

      context.clearRect(0, 0, width, height);
      D3Dots.drawDots(context, dataNodes);

      if (elapsed > ANIMATION_SPAN) newTimer.stop();
    });

    setTimer(newTimer);
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
