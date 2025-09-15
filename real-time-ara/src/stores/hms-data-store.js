
import Papa from "papaparse";
import Pbf from "pbf";
import geobuf from "geobuf";
import { asyncReadable, derived, writable } from "@square/svelte-store";

import { error_message, hmsFiresCount } from "./gui-store.js";
import { loadGeobuf } from "../js/utils-loaders.js";

// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object that will always stay
// NOTE:  up-to-date as data get periodically updated.

// This file is a geobuf-encoded PBF file (protobuf binary) representing a GeoJSON FeatureCollection
const HMS_SMOKE_PBF_URL = "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/geobuf/latest_smoke.pbf";
// This file is a CSV with columns including lat/lon, FRP, and timestamp
// See: https://github.com/pnwairfire/data-scripts/tree/master/monitoring-v5
const HMS_FIRES_CSV_URL = "https://airfire-data-exports.s3.us-west-2.amazonaws.com/hms/v2/data/hms_latest_mv5.csv";

// ----- geojson ---------------------------------------------------------------

// Reloadable HMS Smoke geojson data
export const hms_smoke_geojson = loadGeobuf(HMS_SMOKE_PBF_URL, "hms_smoke");

// Reloadable HMS Fires csv data
export const hms_fires_csv = asyncReadable(
  null,
  async () => {
    // This file is a CSV with columns including lat/lon, FRP, and timestamp
    // See: https://github.com/pnwairfire/data-scripts/tree/master/monitoring-v5
    const response = await fetch(HMS_FIRES_CSV_URL);
    // Validate response
    if (!response.ok) {
      error_message.set("Failed to load HMS fires CSV");
      const err_msg = `Failed to fetch hms/v2/data/hms_latest_mv5.csv: ${response.status} ${response.statusText}`
      console.error(err_msg);
      throw new Error(err_msg);
    }
    // Success:
    // Parse CSV string into an array of objects
    // - header: true → use first row as keys
    // - skipEmptyLines: true → ignore blank lines
    // - dynamicTyping: true → convert numbers and booleans from strings
    const text = await response.text();
    const results = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    if (results.errors.length === 0) {
      hmsFiresCount.set(results.data.length);
      return results.data;
    } else {
      error_message.set("Failed to parse HMS fires CSV");
      const err_msg = `Failed to parse hms_latest_mv5.csv: ${results.errors[0]}`;
      console.error(err_msg, results.errors[0]); // Save Structured errors
      throw new Error(err_msg);
    }
  },
  { reloadable: true }
);
