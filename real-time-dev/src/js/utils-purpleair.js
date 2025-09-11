// Sensor utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

import Papa from "papaparse";
import { DateTime } from "luxon";

/**
 * Converts a PurpleAir synoptic CSV-style array into a GeoJSON FeatureCollection.
 *
 * 'pas' synopticData:
 *   epa_nowcast: 7.7
 *   epa_pm25: 7.2
 *   latitude: 45.031963
 *    longitude: -110.71382
 *   raw_pm25: 4.4
 *   sensor_index: 154193
 *   timezone: "America/Denver"
 *   utc_ts: "2023-07-11 21:00:00+0000"
 *
 * @param {Array<Object>} synopticData - Array of sensor records with fields like `latitude`, `longitude`, `epa_pm25`, etc.
 * @returns {Object} A GeoJSON FeatureCollection of PurpleAir sensor points.
 */
export function purpleairCreateGeoJSON(synopticData) {
  const now = DateTime.utc();

  const features = synopticData.map((site) => {
    const siteTime = DateTime.fromISO(site.utc_ts, { zone: "utc" });
    const latency = now.diff(siteTime, "hours").hours;

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [site.longitude, site.latitude],
      },
      properties: {
        deviceDeploymentID: String(site.sensor_index),
        locationName: `PurpleAir ${site.sensor_index}`,
        epa_nowcast: site.epa_nowcast,
        epa_pm25: site.epa_pm25,
        raw_pm25: site.raw_pm25,
        timezone: site.timezone,
        utc_ts: site.utc_ts,
        latency: latency,
      },
    };
  });

  console.log(`created purupleair geojson`);
  return {
    type: "FeatureCollection",
    features,
  };
}

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
