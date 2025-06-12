// Sensor utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

// npm install papaparse
import Papa from "papaparse";

// Get PurpleAir CSV data
export async function getPurpleAirData(id) {
  const url =
    "https://airfire-data-exports.s3.us-west-2.amazonaws.com/ara-training-2025/sequence-a/purple_air/timeseries/weekly/" +
    id +
    ".csv";
  const response = await fetch(url);
  const text = await response.text();
  const results = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (results.errors.length > 0) {
    // throw new Error('An error occurred!');
    // TOOD:  Write this to a status field in gui-store.js
    console.log(results.error[0]);
    return [];
  } else {
    return results.data;
  }
}
