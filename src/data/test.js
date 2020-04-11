const fs = require("fs");
const d3 = require("d3");

const { data, height, width } = JSON.parse(
  fs.readFileSync("./src/data/singapore.json")
);
const processedData = JSON.parse(
  fs.readFileSync("./src/data/processedData.json")
);

const pointData = data;

let positions = [];
let distances = new Array(pointData.length);

let totalDistance = 0;

// calculate the total distance to a certain point on the svg
pointData.forEach(({ x, y }, i) => {
  const { x: nextX, y: nextY } = pointData[(i + 1) % pointData.length];
  totalDistance += Math.sqrt(
    (nextX - x) * (nextX - x) + (nextY - y) * (nextY - y)
  );
  distances[i] = totalDistance;
});

const perDot = 9; // magic number, experiment and see what works best for you.
// number of dots used in the outermost layer
const dotsUsedOriginal = totalDistance / perDot;
const target = processedData.length / dotsUsedOriginal;

// Determine the number of layers needed
let numLayers = 1;
while (true) {
  let sum = 0;
  for (let j = 1; j <= numLayers; j++) sum += j / numLayers;

  if (sum > target) break;
  numLayers++;
}

// Go through the layers from out in
for (let currLayer = numLayers; currLayer > 0; currLayer--) {
  const scale = currLayer / numLayers;
  const dotsThisLayer = (totalDistance / perDot) * scale;

  let distanceIndex = 0;
  for (let i = 0; i < dotsThisLayer; i++) {
    const nextDistance = (i + 1) * perDot;

    // find the point to perform interpolation on.
    while (distances[distanceIndex] * scale < nextDistance) {
      distanceIndex++;
    }
    let remainingDistance =
      distanceIndex === 0
        ? nextDistance
        : nextDistance - distances[distanceIndex - 1] * scale;

    const { x: thisX, y: thisY } = pointData[distanceIndex % pointData.length];
    const { x: nextX, y: nextY } = pointData[
      (distanceIndex + 1) % pointData.length
    ];
    const angle = Math.atan2(nextY - thisY, nextX - thisX);
    positions.push({
      x:
        (pointData[distanceIndex % pointData.length].x * scale +
          remainingDistance * Math.cos(angle) +
          (width * (1 - scale)) / 2) /
        width,
      y:
        (pointData[distanceIndex % pointData.length].y * scale +
          remainingDistance * Math.sin(angle) +
          (height * (1 - scale)) / 2) /
        width,
    });
  }
}

processedData.forEach((node) => {
  node.sgX = 0;
  node.sgY = 0;
});

positions.forEach((p, i) => {
  if (i >= processedData.length) return;
  processedData[i].sgX = p.x;
  processedData[i].sgY = p.y;
});

fs.writeFileSync(
  "./src/data/processedData.json",
  JSON.stringify(processedData)
);
