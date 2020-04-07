const fs = require("fs");

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
fs.writeFileSync(
  "./src/data/processedData.json",
  JSON.stringify(processedData)
);

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
