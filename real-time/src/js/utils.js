// General utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

// npm install papaparse
import Papa from "papaparse";

// Replace window history without reloading a page.
export function replaceWindowHistory(
  centerlat = "",
  centerlon = "",
  zoom = "",
  monitors = ""
) {
  let base = window.location.origin + window.location.pathname;

  if (centerlat !== "") {
    centerlat = "centerlat=" + Math.round(centerlat * 10000) / 10000;
  }

  if (centerlon !== "") {
    centerlon = "centerlon=" + Math.round(centerlon * 10000) / 10000;
  }

  if (zoom !== "") {
    zoom = "zoom=" + zoom;
  }

  if (monitors !== "" && monitors.length > 0) {
    monitors = "monitors=" + monitors.reduce((a, o) => a + "," + o);
  }

  const url =
    base + "?" + centerlat + "&" + centerlon + "&" + zoom + "&" + monitors;

  window.history.replaceState("dummy", "Monitoring v5", url);
}

// Create data-service URL
export function createDataServiceUrl(ids = []) {
  const baseUrl = "https://tools.airfire.org/monitor-data/v2/data";
  const monitorids = ids.reduce((a, o) => a + "," + o);
  const url = baseUrl + "?" + "monitorids=" + ids;
  return url;
}

// Get PurpleAir CSV data
export async function getPurpleAirData(id) {
  const url =
    "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/purple_air/v2/timeseries/weekly/" +
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
