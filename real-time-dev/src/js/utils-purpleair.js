// Sensor utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

import Papa from "papaparse";
import { DateTime } from "luxon";

// Get PurpleAir CSV data and return parsed array
export async function getPurpleAirData(id) {
  const url =
    "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/purple_air/v4/timeseries/weekly/" +
    id +
    ".csv";
  const response = await fetch(url);
  const text = await response.text();

  // Step 1: Parse CSV with PapaParse
  const results = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  // Step 2: Handle errors
  if (results.errors.length > 0) {
    console.error(results.errors[0]); // was results.error[0], which doesn't exist
    return [];
  }

  // Step 3: Convert timestamp strings to Luxon DateTime objects
  const parsed = results.data.map(row => {
    // Assume the string is ISO-like with TZ offset, e.g. "2025-07-18 07:00:00-0700"
    const dt = DateTime.fromISO(row.local_ts.replace(" ", "T"));
    return {
      ...row,
      local_ts: dt,
      datetime: dt.toUTC()
    };
  });

  return parsed;
}
