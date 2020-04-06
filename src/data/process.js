const fs = require('fs');

const rawData = fs.readFileSync('./data.json');
const patientsData = JSON.parse(rawData).features.map((p) => p.attributes);
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
  }) => ({
    id: Case_ID,
    location: Current_Lo,
    isImported: Imported_o === 'Imported',
    place: Place,
    age: Age,
    nationality: Nationalit,
    status: Status,
    dateConfirmed: new Date(Date_of_Co),
    pressReleaseURL: Prs_rl_URL,
  })
);
fs.writeFileSync('./processedData.json', JSON.stringify(processedData));

const rawCumulativeData = fs.readFileSync('./cumulativeData.json');
const dayData = JSON.parse(rawCumulativeData).features.map((d) => d.attributes);
const processedDayData = dayData.map((d) => ({
  date: new Date(d.Date),
  newConfirmed: d.Confirmation_Volume,
  totalConfirmed: d.Confirmation_Total,
  newDischarged: d.Discharge_Volume,
  totalDischarged: d.Discharge_Total,
}));
fs.writeFileSync('./processedDayData.json', JSON.stringify(processedDayData));
