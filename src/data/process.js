const fs = require("fs");
const d3 = require("d3");

// Milliseconds in a day
const DAY = 1000 * 60 * 60 * 24;

// Daily discharge + confirmation numbers
//
// const rawCumulativeData = fs.readFileSync("./src/data/cumulativeData.json");
// const dayData = JSON.parse(rawCumulativeData).features.map((d) => d.attributes);
// const processedDayData = dayData.map((d) => ({
//   date: new Date(d.Date),
//   newConfirmed: d.Confirmation_Volume,
//   totalConfirmed: d.Confirmation_Total,
//   newDischarged: d.Discharge_Volume,
//   totalDischarged: d.Discharge_Total,
// }));
// fs.writeFileSync(
//   "./src/data/processedDayData.json",
//   JSON.stringify(processedDayData)
// );

// Perform necessary file reading
const rawData = fs.readFileSync("./src/data/data.json");
const rawClusterData = fs
  .readFileSync("./src/data/Covid-19 SG - Cluster List.csv")
  .toString();
const { data, height, width } = JSON.parse(
  fs.readFileSync("./src/data/singapore.json")
);

// Alternate Singapore pattern - 1189 dots
// const singapore = JSON.parse(fs.readFileSync("./src/data/another-sg.json"));

// Process each patient

const patientsData = JSON.parse(rawData)
  .map((d) => d.features.map((p) => p.attributes))
  .flat()
  .sort((a, b) => a.Case_ID - b.Case_ID);
let date;
let dayNo;
let weekStart;
let weekNo;
const processedData = patientsData.map(
  ({
    Case_ID,
    Current_Lo,
    Imported_o,
    Place,
    Age,
    Nationalit,
    Status,
    Date_of_Co,
    Date_of_Di,
    Prs_rl_URL,
  }) => {
    const roundedDate = new Date(Date_of_Co);
    roundedDate.setUTCHours(0);

    if (date !== Date_of_Co) {
      date = Date_of_Co;
      dayNo = 0;
    }

    if (!weekStart || roundedDate.getTime() - weekStart > 7 * DAY) {
      weekStart = roundedDate.getTime();
      weekNo = 0;
    }

    const roundedDischarge = Date_of_Di ? new Date(Date_of_Di) : null;
    if (roundedDischarge) roundedDischarge.setUTCHours(0);

    return {
      id: Case_ID,
      location: Current_Lo,
      isImported: Imported_o === "Imported",
      place: Place,
      age: Age,
      nationality: Nationalit,
      status: Status,
      dateConfirmed: roundedDate.getTime(),
      dateDischarged: roundedDischarge ? roundedDischarge.getTime() : undefined,
      pressReleaseURL: Prs_rl_URL,
      dayNo: dayNo++,
      weekNo: weekNo++,
    };
  }
);

// Calculate the angle accordingly.
let dayMax = -1;
let day = null;
for (let i = processedData.length - 1; i >= 0; i--) {
  if (processedData[i].dateConfirmed !== day) {
    dayMax = processedData[i].dayNo;
    day = processedData[i].dateConfirmed;
  }

  processedData[i].angle = (processedData[i].dayNo / dayMax) * 2 * Math.PI;
}

// Process the clusters for linkGraph
// These clusters were updated manually up until 4 April.

// 1. Get cluster data and update the patient data
const clusterData = d3.csvParse(rawClusterData, ({ Cluster, People }) => {
  const people = People.split(",").map((p) => parseInt(p));

  return {
    cluster: Cluster,
    source: people[0],
    children: people.slice(1),
  };
});

for (let { cluster, source, children } of clusterData) {
  processedData[source - 1].cluster = cluster;
  processedData[source - 1].children = children;
}

// Begin processing from the last id. This serves as a queue of nodes to be processed.
const nodeWithChildren = processedData.filter((d) => d.children).reverse();

// We want to create dummy nodes to achieve a nicer layout.
// These dummy nodes help stratify the tree so that we can balance it later.
let dummyID = -1;
let treeData = [{ id: dummyID--, children: [] }];

while (nodeWithChildren.length !== 0) {
  const currNode = Object.assign({}, nodeWithChildren.pop());
  const nodeTime = currNode.dateConfirmed;
  const children = currNode.children;

  // If the node is present in the tree Data, skip it.
  if (treeData.filter((a) => a.id === currNode.id).length !== 0) {
    continue;
  }

  let dummyNode = {};

  if (children) {
    // Check if the node time is more than a day behind the children,
    // if so, create a dummy node to achieve a nicer layout.
    for (let i = 0; i < children.length; i++) {
      const childNode = processedData[children[i] - 1];
      const childConfirmedTime = childNode.dateConfirmed;
      if (childConfirmedTime - nodeTime > 1 * DAY) {
        dummyNode = {
          id: dummyID--,
          dateConfirmed: nodeTime + DAY,
          children: children.slice(i),
          parentId: currNode.id,
        };
        currNode.children = children.slice(0, i);
        currNode.children.push(dummyNode.id);
        nodeWithChildren.push(dummyNode);
        break;
      }
    }
    for (let child of currNode.children) {
      if (child > 0) {
        const childNode = processedData[child - 1];

        childNode.parentId = currNode.id;
        nodeWithChildren.push(childNode);
      }
    }
  }

  treeData.push(currNode);
}

treeData.forEach((d, i) => {
  if (!d.parentId && i !== 0) {
    d.parentId = treeData[0].id;
  }
});

const root = d3.stratify()(treeData);

root.count().sort((a, b) => b.value - a.value);

d3.tree().size([1000, 1000])(root);
root.each((node) => {
  const index = parseInt(node.id) - 1;
  if (index >= 0) {
    processedData[index].treeY = node.x;
    processedData[index].treeX = node.y;
  }
});

processedData.forEach((d) => (d.parentId = undefined));

// Calculate the positions of the Singapore silhoulette.

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
