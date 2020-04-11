const D3Dots = {
  drawDots(ctx, nodes) {
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.fill;
      ctx.fill();
    });
  },

  drawHorizontalLinks(ctx, nodes) {
    nodes.forEach((node) => {
      if (node.children) {
        node.children.forEach((child) => {
          const childNode = nodes[child - 1];
          ctx.beginPath();
          if (node.cluster) {
            if (node.cluster === "F") ctx.strokeStyle = "green";
            else if (node.cluster === "C") ctx.strokeStyle = "red";
            else ctx.strokeStyle = "blue";
          }
          ctx.moveTo(node.x, node.y);
          const midX = (childNode.x + node.x) / 2;
          ctx.bezierCurveTo(
            midX,
            node.y,
            midX,
            childNode.y,
            childNode.x,
            childNode.y
          );
          ctx.stroke();
        });
      }
    });
  },

  drawVerticalLinks(ctx, nodes) {
    nodes.forEach((node) => {
      if (node.children) {
        node.children.forEach((child) => {
          const childNode = nodes[child - 1];
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          const midY = (childNode.y + node.y) / 2;
          ctx.bezierCurveTo(
            node.x,
            midY,
            childNode.x,
            midY,
            childNode.x,
            childNode.y
          );
          ctx.stroke();
        });
      }
    });
  },
};

export default D3Dots;
