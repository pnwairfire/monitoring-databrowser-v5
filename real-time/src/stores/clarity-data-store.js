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

export const clarityLoadTime = writable(1000);

// ----- geojson ---------------------------------------------------------------

// Reloadable AirNow geojson data
export const clarity_geojson = asyncReadable(
  {},
  async () => {
    const response = await fetch(
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/sensors/v3/PM2.5/latest/geojson/mv4_clarity_PM2.5_latest.geojson"
    );
    if (response.ok) {
      const userObject = await response.json();
      console.log("loaded clarity geojson");
      return userObject;
    } else {
      error_message.set("Failed to load clarity geojson");
      throw new Error(response.message);
    }
  },
  { reloadable: true }
);

// ----- time series -----------------------------------------------------------

// Reloadable AirNow data
export const clarity = asyncReadable(
  new Monitor(),
  async () => {
    const monitor = new Monitor();
    let start = Date.now();
    await monitor.loadCustom(
      "clarity_PM2.5_latest",
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/sensors/v3/PM2.5/latest/data"
    );
    let end = Date.now();
    let elapsed = (end - start) / 1000;
    let rounded = Math.round(10 * elapsed) / 10;
    clarityLoadTime.set(rounded);
    return monitor;
  },
  { reloadable: true }
);
