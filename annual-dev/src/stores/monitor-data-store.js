
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

// ----- geojson ---------------------------------------------------------------

export const airnow_geojson = loadGeojson(AIRNOW_LATEST_GEOJSON, "airnow");

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

// All monitors combined (changes whenever any underlying data changes)
export const all_monitors = derived(
  [airnow],
  ([$airnow]) => {
    let all_monitors = $airnow.dropEmpty();
    monitorCount.set(all_monitors.count());
    return all_monitors;
  }
);
