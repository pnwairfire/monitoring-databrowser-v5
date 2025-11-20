
import { DateTime } from 'luxon';
import { asyncReadable, derived, writable } from "@square/svelte-store";
import Monitor from "air-monitor";

import { error_message, monitorCount, selected_datetime, lookback_days } from "./gui-store.js";
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
    const start = DateTime.now();

    try {
      // await monitor.loadLatest("airnow");
      await monitor.loadAnnual("2024");

      // --- Reset selected_datetime based on newly loaded data --------------
      try {
        const dts = monitor.getDatetime();   // array of luxon DateTime objects
        if (Array.isArray(dts) && dts.length > 0) {
          // Latest by milliseconds
          const latestUtc = dts.reduce(
            (max, dt) => (dt.toMillis() > max.toMillis() ? dt : max),
            dts[0]
          );

          if (latestUtc && latestUtc.isValid) {
            const latestLocal = latestUtc.toLocal();
            const isoForInput = latestLocal.toISO({
              suppressSeconds: true,
              suppressMilliseconds: true,
              includeOffset: false    // required for datetime-local
            });

            if (isoForInput) {
              selected_datetime.set(isoForInput);
              console.log(
                `selected_datetime updated to latest AirNow timestamp: ${isoForInput}`
              );
            }
          }
        } else {
          console.warn("AirNow monitor has no datetime values; leaving selected_datetime unchanged.");
        }
      } catch (e) {
        console.warn("Unable to update selected_datetime from AirNow monitor:", e);
      }
      // ---------------------------------------------------------------------

    } catch (err) {
      error_message.set("Failed to load AirNow monitor data");
      const err_msg = `loadLatest("airnow") failed: ${err.message}`;
      console.error(err_msg);
      throw new Error(err_msg);
    }

    const end = DateTime.now();
    const elapsed = end.diff(start, "seconds").seconds;
    const rounded = Math.round(10 * elapsed) / 10;
    airnowLoadTime.set(rounded);
    console.log(`loaded airnow monitor data in ${rounded} seconds`);

    return monitor;
  },
  { reloadable: true }
);



// AirNow subset generated whenever a new date or lookback window is selected
export const airnow_selected = derived(
  [airnow, selected_datetime, lookback_days],
  ([$airnow, $selected_datetime, $lookback_days]) => {
    // No base monitor yet → no subset yet
    if (!$airnow || typeof $airnow.filterDatetime !== "function") {
      return null;
    }

    try {
      // If no selected datetime, fall back to "now" in local time
      const dtLocal = $selected_datetime
        ? DateTime.fromISO($selected_datetime)       // interpreted in local zone
        : DateTime.local();

      if (!dtLocal.isValid) {
        throw new Error(`Invalid selected_datetime: ${$selected_datetime}`);
      }

      // Convert to UTC for filtering, since your monitor data are in UTC
      const enddate = dtLocal.toUTC();

      // Compute startdate from lookback_days (if provided and > 0)
      let startdate = null;
      if (typeof $lookback_days === "number" && $lookback_days > 0) {
        // e.g. lookback_days = 1 → just the selected day
        //      lookback_days = 7 → 7-day window ending on selected date
        startdate = enddate.minus({ days: $lookback_days - 1 });
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
// - `airnow_selected` recomputes
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