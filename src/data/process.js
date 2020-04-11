const fs = require("fs");
const d3 = require("d3");

// Milliseconds in a day
const DAY = 1000 * 60 * 60 * 24;

// Daily numbers
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

const rawData = fs.readFileSync("./src/data/data.json");
const patientsData = JSON.parse(rawData)
  .map((d) => d.features.map((p) => p.attributes))
  .flat();
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
    Prs_rl_URL,
  }) => {
    const roundedDate = new Date(Date_of_Co);
    roundedDate.setHours(0);

    if (date !== Date_of_Co) {
      date = Date_of_Co;
      dayNo = 0;
    }

    if (!weekStart || roundedDate.getTime() - weekStart > 7 * DAY) {
      weekStart = roundedDate.getTime();
      weekNo = 0;
    }

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
      weekNo: weekNo++,
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

const singapore = JSON.parse(fs.readFileSync("./src/data/another-sg.json"));

singapore.forEach((p, i) => {
  processedData[i].sgX = p.x;
  processedData[i].sgY = p.y;
});

fs.writeFileSync(
  "./src/data/processedData.json",
  JSON.stringify(processedData)
);
