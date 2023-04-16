const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel files
const stationWorkbook = XLSX.readFile('./Data/station.xlsx');
const bioResultsWorkbook = XLSX.readFile('./Data/biologicalresult.xlsx');

// Get the first worksheet from each workbook
const stationSheet = stationWorkbook.Sheets[stationWorkbook.SheetNames[0]];
const bioResultsSheet = bioResultsWorkbook.Sheets[bioResultsWorkbook.SheetNames[0]];

// Convert the worksheets to JSON format
const stationData = XLSX.utils.sheet_to_json(stationSheet);
const bioResultsData = XLSX.utils.sheet_to_json(bioResultsSheet);

// Function to map choice list values to numerical values
function mapChoiceValue(value) {
  const choiceMap = {
    'None': 0,
    'Mild': 1,
    'Moderate': 2,
    'Serious': 3,
    'Severe': 4,
  };

  return choiceMap[value] !== undefined ? choiceMap[value] : value;
}

// Allowed characteristics and their default values
const allowedCharacteristics = {
  "Ammonia and ammonium": "",
  "Temperature, water": "",
  "Temperature, air, deg C": "",
  "Stream flow, instantaneous": "",
  "Specific conductance": "",
  "Acidity, (H+)": "",
  "pH": "",
  "Total suspended solids": "",
  "Nitrogen, mixed forms (NH3), (NH4), organic, (NO2) and (NO3)": "",
  "Organic Nitrogen": "",
  "Kjeldahl nitrogen": "",
  "Inorganic nitrogen (nitrate and nitrite)": "",
  "Phosphorus": "",
  "Oil and Grease": "",
  "Detergent, severity (choice list)": "",
  "Floating Garbage Severity (choice List)": "",
  "Floating algae mat - severity (choice list)": "",
  "Floating debris - severity (choice list)": "",
  "Turbidity severity (choice list)": "",
  "Turbidity": ""
};

// Combine data based on MonitoringLocationIdentifier
const combinedData = stationData.reduce((result, stationItem) => {
  const matchingBioItems = bioResultsData.filter(
    (bioItem) => bioItem.MonitoringLocationIdentifier === stationItem.MonitoringLocationIdentifier
  );

  const bioData = { ...allowedCharacteristics };

  matchingBioItems.forEach((bioItem) => {
    if (allowedCharacteristics.hasOwnProperty(bioItem.CharacteristicName)) {
      bioData[bioItem.CharacteristicName] = mapChoiceValue(bioItem.ResultMeasureValue);
    }
  });

  result[stationItem.MonitoringLocationIdentifier] = {
    Latitude: stationItem.LatitudeMeasure,
    Longitude: stationItem.LongitudeMeasure,
    ...bioData,
  };

  return result;
}, {});

// Save the combined data to a JSON file
fs.writeFileSync('./Data/combinedData.json', JSON.stringify(combinedData, null, 2));

console.log('Data combined and saved to combinedData.json');
