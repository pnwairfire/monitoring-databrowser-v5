
import { DateTime } from 'luxon';
import { asyncReadable, derived, writable } from "@square/svelte-store";
import Monitor from "air-monitor";

import { error_message, monitorCount, selected_date } from "./gui-store.js";
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

// AirNow subset generated whenever a new date is selected
export const airnow_selected = derived(
  [airnow, selected_date],
  ([$airnow, $selected_date]) => {
    if (!$airnow) return null;

    try {
      const monitorSubset = subsetAirnowByDate($airnow, $selected_date);
      return monitorSubset;
    } catch (err) {
      const msg = `Failed to subset AirNow monitor data: ${err.message}`;
      console.error(msg);
      error_message.set(msg);
      return null;
    }
  }
);
// ----- geojson generated from Monitor ----------------------------------------
//
// This stays in sync automatically:
// - when `airnow` reloads via asyncReadable
// - `all_monitors` recomputes
// - this derived store recomputes and Leaflet sees updated GeoJSON.

export const airnow_geojson = derived(
  [airnow],
  ([$airnow]) => {
    if (!$airnow || typeof $airnow.createGeoJSON !== "function") {
      return null;
    }

    try {
      const nonEmpty = $airnow.dropEmpty();
      return nonEmpty.createGeoJSON();
    } catch (err) {
      const msg = `Failed to create AirNow GeoJSON: ${err.message}`;
      console.error(msg);
      error_message.set(msg);
      return null;
    }
  }
);