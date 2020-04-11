const fs = require("fs");
const d3 = require("d3");

const singapore = JSON.parse(fs.readFileSync("./src/data/singapore.json"));
const processedData = JSON.parse(
  fs.readFileSync("./src/data/processedData.json")
);

let positions = [];
let distances = new Array(singapore.data.length);

let totalDistance = 0;

singapore.data.forEach(({ x, y }, i) => {
  const { x: nextX, y: nextY } = singapore.data[
    (i + 1) % singapore.data.length
  ];
  totalDistance += Math.sqrt(
    (nextX - x) * (nextX - x) + (nextY - y) * (nextY - y)
  );
  distances[i] = totalDistance;
});

const remaining = (processedData.length - positions.length) / 6;
const perDot = totalDistance / remaining;

let distanceIndex = 0;

for (let i = 0; i < remaining; i++) {
  const nextDistance = (i + 1) * perDot;
  while (distances[distanceIndex] < nextDistance) {
    distanceIndex++;
  }
  const remainingDistance =
    distanceIndex === 0
      ? nextDistance
      : nextDistance - distances[distanceIndex - 1];

  const { x: thisX, y: thisY } = singapore.data[
    distanceIndex % singapore.data.length
  ];
  const { x: nextX, y: nextY } = singapore.data[
    (distanceIndex + 1) % singapore.data.length
  ];
  const angle = Math.atan2(nextY - thisY, nextX - thisX);
  positions.push({
    x:
      singapore.data[distanceIndex % singapore.data.length].x +
      remainingDistance * Math.cos(angle),
    y:
      singapore.data[distanceIndex % singapore.data.length].y +
      remainingDistance * Math.sin(angle),
  });
}

positions.forEach((p, i) => {
  processedData[i].sgX = p.x;
  processedData[i].sgY = p.y;
});

fs.writeFileSync(
  "./src/data/processedData.json",
  JSON.stringify(processedData)
);
