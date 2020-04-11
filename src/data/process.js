const fs = require("fs");
const d3 = require("d3");

// Daily numbers
const rawCumulativeData = fs.readFileSync("./src/data/cumulativeData.json");
const dayData = JSON.parse(rawCumulativeData).features.map((d) => d.attributes);
const processedDayData = dayData.map((d) => ({
  date: new Date(d.Date),
  newConfirmed: d.Confirmation_Volume,
  totalConfirmed: d.Confirmation_Total,
  newDischarged: d.Discharge_Volume,
  totalDischarged: d.Discharge_Total,
}));
fs.writeFileSync(
  "./src/data/processedDayData.json",
  JSON.stringify(processedDayData)
);

const rawData = fs.readFileSync("./src/data/data.json");
const patientsData = JSON.parse(rawData).features.map((p) => p.attributes);
let date;
let dayNo;
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
    Prs_rl_URL,
  }) => {
    if (date !== Date_of_Co) {
      date = Date_of_Co;
      dayNo = 0;
    }

    const roundedDate = new Date(Date_of_Co);
    roundedDate.setHours(0);

    return {
      id: Case_ID,
      location: Current_Lo,
      isImported: Imported_o === "Imported",
      place: Place,
      age: Age,
      nationality: Nationalit,
      status: Status,
      dateConfirmed: roundedDate,
      pressReleaseURL: Prs_rl_URL,
      dayNo: dayNo++,
    };
  }
);

const rawClusterData = fs
  .readFileSync("./src/data/Covid-19 SG - Cluster List.csv")
  .toString();
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

let dayMax = -1;
let day = null;
for (let i = processedData.length - 1; i >= 0; i--) {
  if (processedData[i].dateConfirmed.getTime() !== day) {
    dayMax = processedData[i].dayNo;
    day = processedData[i].dateConfirmed.getTime();
  }

  processedData[i].angle = (processedData[i].dayNo / dayMax) * 2 * Math.PI;
}

// Milliseconds in a day
const DAY = 1000 * 60 * 60 * 24;

const nodeWithChildren = processedData.filter((d) => d.children).reverse();

// We want to create dummy nodes to achieve a nicer layout.
let dummyID = -1;
let treeData = [{ id: dummyID--, children: [] }];

while (nodeWithChildren.length !== 0) {
  const currNode = Object.assign({}, nodeWithChildren.pop());
  const nodeTime = new Date(currNode.dateConfirmed).getTime();
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
      const childConfirmedTime = new Date(childNode.dateConfirmed).getTime();
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

// const singapore = JSON.parse(fs.readFileSync("./src/data/singapore.json"));

// let positions = [];
// let distances = new Array(singapore.data.length);

// let totalDistance = 0;

// singapore.data.forEach(({ x, y }, i) => {
//   const { x: nextX, y: nextY } = singapore.data[
//     (i + 1) % singapore.data.length
//   ];
//   totalDistance += Math.sqrt(
//     (nextX - x) * (nextX - x) + (nextY - y) * (nextY - y)
//   );
//   distances[i] = totalDistance;
// });

// const remaining = (processedData.length - positions.length) / 6;
// const perDot = totalDistance / remaining;

// let distanceIndex = 0;

// for (let i = 0; i < remaining; i++) {
//   const nextDistance = (i + 1) * perDot;
//   while (distances[distanceIndex] < nextDistance) {
//     distanceIndex++;
//   }
//   const remainingDistance =
//     distanceIndex === 0
//       ? nextDistance
//       : nextDistance - distances[distanceIndex - 1];

//   const { x: thisX, y: thisY } = singapore.data[
//     distanceIndex % singapore.data.length
//   ];
//   const { x: nextX, y: nextY } = singapore.data[
//     (distanceIndex + 1) % singapore.data.length
//   ];
//   const angle = Math.atan2(nextY - thisY, nextX - thisX);
//   positions.push({
//     x:
//       singapore.data[distanceIndex % singapore.data.length].x +
//       remainingDistance * Math.cos(angle),
//     y:
//       singapore.data[distanceIndex % singapore.data.length].y +
//       remainingDistance * Math.sin(angle),
//   });
// }

// positions.forEach((p, i) => {
//   processedData[i].sgX = p.x;
//   processedData[i].sgY = p.y;
// });

const singapore = JSON.parse(fs.readFileSync("./src/data/another-sg.json"));

singapore.forEach((p, i) => {
  processedData[i].sgX = p.x;
  processedData[i].sgY = p.y;
});

fs.writeFileSync(
  "./src/data/processedData.json",
  JSON.stringify(processedData)
);
