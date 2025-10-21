import { DateTime } from "luxon";
import { asyncReadable, derived, writable } from "@square/svelte-store";
import Monitor from "air-monitor";

import { error_message, clarityCount } from "./gui-store.js";
import { loadGeojson } from "../js/utils-loaders.js";

// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object that will always stay
// NOTE:  up-to-date as data get periodically updated.

export const clarityLoadTime = writable(1000);

// GeoJSON files with sensor locations and metadata
const CLARITY_LATEST_GEOJSON =
  "https://airfire-data-exports.s3.us-west-2.amazonaws.com/sensors/v3/PM2.5/latest/geojson/mv4_clarity_PM2.5_latest.geojson";

// ----- geojson ---------------------------------------------------------------

// Reloadable Clarity geojson data
export const clarity_geojson = loadGeojson(CLARITY_LATEST_GEOJSON, "clarity");

// ----- time series -----------------------------------------------------------

// Reloadable Clarity data
export const clarity = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    let start = DateTime.now();
    try {
      await monitor.loadCustom(
        "clarity_PM2.5_latest",
        "https://airfire-data-exports.s3.us-west-2.amazonaws.com/sensors/v3/PM2.5/latest/data"
      );
    } catch (err) {
      error_message.set("Failed to load Clarity sensor data");
      const err_msg = `loadCustom() failed: ${err.message}`;
      console.error(err_msg);
      throw new Error(err_msg);
    }
    // Reduce to the last 168 hours to match PurpleAir data
    monitor.data = monitor.data.slice(-168);
    clarityCount.set(monitor.count());
    let end = DateTime.now();
    let elapsed = end.diff(start, "seconds").seconds;
    let rounded = Math.round(10 * elapsed) / 10;
    clarityLoadTime.set(rounded);
    console.log(`loaded clarity sensor data in ${rounded} seconds`);
    return monitor;
  },
  { reloadable: true }
);
