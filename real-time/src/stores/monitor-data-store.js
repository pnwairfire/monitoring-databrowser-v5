// The air-monitor package encapsulates much of the functionality found in the
// AirMonitor R package.

// npm install github:MazamaScience/air-monitor
import Monitor from "air-monitor";

// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object that will always stay
// NOTE:  up-to-date as data get periodically updated.

// npm install @square/svelte-store --save
import { asyncReadable, derived, writable } from "@square/svelte-store";

import { error_message, monitorCount } from "./gui-store.js";

export const airnowLoadTime = writable(1000);

// ----- geojson ---------------------------------------------------------------

// Reloadable AirNow geojson data
export const airnow_geojson = asyncReadable(
  {},
  async () => {
    const response = await fetch(
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/monitoring/v2/latest/geojson/mv4_airnow_PM2.5_latest.geojson"
    );
    if (response.ok) {
      const userObject = await response.json();
      console.log("loaded airnow geojson");
      return userObject;
    } else {
      error_message.set("Failed to load airnow geojson");
      throw new Error(response.message);
    }
  },
  { reloadable: true }
);

// Reloadable AIRSIS geojson data
export const airsis_geojson = asyncReadable(
  {},
  async () => {
    const response = await fetch(
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/monitoring/v2/latest/geojson/mv4_airsis_PM2.5_latest.geojson"
    );
    if (response.ok) {
      const userObject = await response.json();
      console.log("loaded airsis geojson");
      return userObject;
    } else {
      error_message.set("Failed to load airsis geojson");
      throw new Error(response.message);
    }
  },
  { reloadable: true }
);

// Reloadable WRCC geojson data
export const wrcc_geojson = asyncReadable(
  {},
  async () => {
    const response = await fetch(
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/monitoring/v2/latest/geojson/mv4_wrcc_PM2.5_latest.geojson"
    );
    if (response.ok) {
      const userObject = await response.json();
      console.log("loaded wrcc geojson");
      return userObject;
    } else {
      error_message.set("Failed to load wrcc geojson");
      throw new Error(response.message);
    }
  },
  { reloadable: true }
);

// ----- time series -----------------------------------------------------------

// Reloadable AirNow data
export const airnow = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    let start = Date.now();
    await monitor.loadLatest("airnow");
    let end = Date.now();
    let elapsed = (end - start) / 1000;
    let rounded = Math.round(10 * elapsed) / 10;
    airnowLoadTime.set(rounded);
    return monitor;
  },
  { reloadable: true }
);

// Reloadable AIRSIS data
export const airsis = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    await monitor.loadLatest("airsis");
    return monitor;
  },
  { reloadable: true }
);

// Reloadable WRCC data
export const wrcc = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    await monitor.loadLatest("wrcc");
    return monitor;
  },
  { reloadable: true }
);

// All monitors combined (changes whenever any underlying data changes)
export const all_monitors = derived(
  [airnow, airsis, wrcc],
  ([$airnow, $airsis, $wrcc]) => {
    let all_monitors = $airnow.combine($airsis).combine($wrcc).dropEmpty();
    monitorCount.set(all_monitors.count());
    return all_monitors;
  }
);
