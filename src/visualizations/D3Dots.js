const D3Dots = {
  drawDots(ctx, nodes) {
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.fill;
      ctx.fill();
    });
  },
};

export default D3Dots;
