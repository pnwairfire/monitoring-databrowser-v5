
import { DateTime } from 'luxon';
import { asyncReadable, derived, writable } from "@square/svelte-store";
import Monitor from "air-monitor";

import { error_message, monitorCount, selected_date, lookback_days } from "./gui-store.js";
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


// AirNow subset generated whenever a new date or lookback window is selected
export const airnow_selected = derived(
  [airnow, selected_date, lookback_days],
  ([$airnow, $selected_date, $lookback_days]) => {
    // No base monitor yet → no subset yet
    if (!$airnow || typeof $airnow.filterDatetime !== "function") {
      return null;
    }

    try {
      // If no selected date, use "today" in UTC as a fallback
      const enddate = ($selected_date
        ? DateTime.fromISO($selected_date, { zone: "utc" })
        : DateTime.utc()
      ).endOf("day");

      if (!enddate.isValid) {
        throw new Error(`Invalid selected_date: ${$selected_date}`);
      }

      // Compute startdate from lookback_days (if provided and > 0)
      let startdate = null;
      if (typeof $lookback_days === "number" && $lookback_days > 0) {
        // e.g. lookback_days = 1 → just the selected day
        //      lookback_days = 7 → 7-day window ending on selected date
        startdate = enddate.minus({ days: $lookback_days - 1 }).startOf("day");
      }

      const timezone = "UTC"; // adjust if your Monitor data uses a different zone

      // filterDatetime(startdate, enddate, timezone) returns a new Monitor
      const monitorSubset = $airnow
        .filterDatetime(startdate, enddate, timezone)
        .dropEmpty();

      return monitorSubset;
    } catch (err) {
      // Treat "No datetime values found in monitor.data" as a benign "no data" case
      if (err.message && err.message.includes("No datetime values found in monitor.data")) {
        console.warn("No datetime values found for the selected window; returning empty subset.");
        return null; // map will show nothing for that date range
      }

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
  [airnow_selected],
  ([$airnow_selected]) => {
    if (!$airnow_selected || typeof $airnow_selected.createGeoJSON !== "function") {
      return null;
    }

    try {
      const nonEmpty = $airnow_selected.dropEmpty();
      return nonEmpty.createGeoJSON();
    } catch (err) {
      const msg = `Failed to create AirNow GeoJSON: ${err.message}`;
      console.error(msg);
      error_message.set(msg);
      return null;
    }
  }
);