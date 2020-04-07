import * as d3 from "d3";
import _ from "lodash";
import d3ForceBounce from "d3-force-bounce";
import d3ForceSurface from "d3-force-surface";

const D3Dots = {
  initialize(ctx, nodes) {
    this._ctx = ctx;
    this._nodes = nodes;
    this._width = this._ctx.canvas.clientWidth;
    this._height = this._ctx.canvas.clientHeight;
  },

  simulateGather() {
    this.stop();

    const controlNode = {
      x: this._width / 2,
      y: this._height / 2,
    };
    const allNodes = [controlNode, ...this._nodes];
    const links = allNodes.map((_, i) => ({ source: i, target: 0 }));

    this._simulation = d3.forceSimulation(allNodes);
    const gravity = d3.forceManyBody().strength((_, i) => (i === 0 ? 0 : -4));
    const linkForce = d3.forceLink(links).strength(0.2).distance(1);

    this._simulation.force("gravity", gravity).force("link", linkForce);

    this._simulation.alphaMin(0.1).velocityDecay(0.6);
    this._simulation.on("tick", () => {
      this.drawDots();
    });
  },

  drawDots() {
    this._ctx.clearRect(0, 0, this._width, this._height);
    this._nodes.forEach((node) => {
      this._ctx.beginPath();
      this._ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
      this._ctx.fillStyle = node.fill;
      this._ctx.fill();
    });
  },

  stop() {
    if (this._simulation) this._simulation.stop();
  },

  simulateBrownian() {
    this.stop();
    this._nodes.forEach((node) => {
      node.vx = (Math.random() - 0.5) * 15;
      node.vy = (Math.random() - 0.5) * 15;
    });

    this._simulation = d3.forceSimulation(this._nodes);
    this._simulation.force("bounce", d3ForceBounce().radius(3));
    this._simulation.force(
      "container",
      d3ForceSurface().surfaces([
        {
          from: { x: 0, y: 0 },
          to: { x: 0, y: this._height },
        },
        {
          from: { x: 0, y: 0 },
          to: { x: this._width, y: 0 },
        },
        {
          from: { x: 0, y: this._height },
          to: { x: this._width, y: this._height },
        },
        {
          from: { x: this._width, y: 0 },
          to: { x: this._width, y: this._height },
        },
      ])
    );
    this._simulation.velocityDecay(0).alphaMin(0);
    this._simulation.on("tick", () => {
      this.drawDots();
    });
  },
};

export default D3Dots;
