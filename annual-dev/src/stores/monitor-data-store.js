
import { DateTime } from 'luxon';
import { asyncReadable, derived, writable } from "@square/svelte-store";
import Monitor from "air-monitor";

import { error_message, monitorCount } from "./gui-store.js";
import { loadGeojson } from "../js/utils-loaders.js";

// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object that will always stay
// NOTE:  up-to-date as data get periodically updated.

export const airnowLoadTime = writable(null);

// GeoJSON files with monitor locations and metadata
const AIRNOW_LATEST_GEOJSON = "https://airfire-data-exports.s3.us-west-2.amazonaws.com/monitoring/v2/latest/geojson/mv4_airnow_PM2.5_latest.geojson";
const AIRSIS_LATEST_GEOJSON = "https://airfire-data-exports.s3.us-west-2.amazonaws.com/monitoring/v2/latest/geojson/mv4_airsis_PM2.5_latest.geojson";
const WRCC_LATEST_GEOJSON = "https://airfire-data-exports.s3.us-west-2.amazonaws.com/monitoring/v2/latest/geojson/mv4_wrcc_PM2.5_latest.geojson";

// ----- geojson ---------------------------------------------------------------

export const airnow_geojson = loadGeojson(AIRNOW_LATEST_GEOJSON, "airnow");
export const airsis_geojson = loadGeojson(AIRSIS_LATEST_GEOJSON, "airsis");
export const wrcc_geojson = loadGeojson(WRCC_LATEST_GEOJSON, "wrcc");

// ----- time series -----------------------------------------------------------

// Reloadable AirNow data
export const airnow = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    let start = DateTime.now();
    try {
      await monitor.loadLatest("airnow");
    } catch (err) {
      error_message.set("Failed to load AirNow monitor data");
      const err_msg = `loadLatest("airnow") failed: ${err.message}`;
      console.error(err_msg);
      throw new Error(err_msg);
    }
    let end = DateTime.now();
    let elapsed = end.diff(start, 'seconds').seconds;
    let rounded = Math.round(10 * elapsed) / 10;
    airnowLoadTime.set(rounded);
    console.log(`loaded airnow monitor data in ${rounded} seconds`);
    return monitor;
  },
  { reloadable: true }
);

// Reloadable AIRSIS data
export const airsis = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    try {
      await monitor.loadLatest("airsis");
    } catch (err) {
      error_message.set("Failed to load AIRSIS monitor data");
      const err_msg = `loadLatest("airsis") failed: ${err.message}`;
      console.error(err_msg);
      throw new Error(err_msg);
    }
    console.log(`loaded airsis monitor data`);
    return monitor;
  },
  { reloadable: true }
);

// Reloadable WRCC data
export const wrcc = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    try {
      await monitor.loadLatest("wrcc");
    } catch (err) {
      error_message.set("Failed to load WRCC monitor data");
      const err_msg = `loadLatest("wrcc") failed: ${err.message}`;
      console.error(err_msg);
      throw new Error(err_msg);
    }
    console.log(`loaded wrcc monitor data`);
    return monitor;
  },
  { reloadable: true }
);

// All monitors combined (changes whenever any underlying data changes)
export const all_monitors = derived(
  [airnow, airsis, wrcc],
  ([$airnow, $airsis, $wrcc]) => {
    let all_monitors = $airnow.combine($airsis).combine($wrcc).dropEmpty();
    // Reduce to the last 168 hours to match PurpleAir data
    all_monitors.data = all_monitors.data.slice(-168);
    monitorCount.set(all_monitors.count());
    return all_monitors;
  }
);
