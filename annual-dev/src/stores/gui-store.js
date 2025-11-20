import { readable, writable, derived } from "svelte/store";
import { DateTime } from "luxon";

// Version 5.5.0 = v5 . package update refactor . CalFire layer
export const VERSION = readable("5.5.7");

// Status messages
export const error_message = writable("");
export const monitorCount = writable(0);

// GUI state for the leaflet map
export const centerLon = writable(-100);
export const centerLat = writable(40);
export const zoom = writable(4);
export const mapLastUpdated = writable(null); // or writable(DateTime.now())

// GUI state for user selections
export const hovered_monitor_id = writable("");
export const selected_monitor_ids = writable([]);
export const unselected_monitor_id = writable("");

// Selected date for the main date picker
// Stored as "YYYY-MM-DD" so it binds cleanly to <input type="date">
export const selected_date = writable(DateTime.now().toISODate()); // using the browsers's timezone
// // //export const selected_date = writable(DateTime.utc().toISODate()); // Strict UTC semantics
export const lookback_days = writable(10);

export const map_update_needed = writable(false);

/**
 * IDs of monitors that should be excluded from display.
 * Populated at runtime from a URL in App.svelte.
 */
export const exclusion_ids = writable(new Set());

/**
 * Format an array of strings as a human-readable list:
 * - ["A"]           -> "A"
 * - ["A","B"]       -> "A and B"
 * - ["A","B","C"]   -> "A, B, and C"
 *
 * @param {string[]} items
 * @returns {string}
 */
function formatList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Derived store for the "Loaded ..." status text.
 *
 * Example:
 *   "Loaded 123 monitors, 456 PurpleAir sensors, and 7 CalFire fires"
 *
 * Empty string if nothing is loaded yet.
 */
export const loadedStatusText = derived(
  [
    monitorCount,
  ],
  ([
    $monitorCount,
  ]) => {
    const parts = [];

    if ($monitorCount > 0) {
      parts.push(`${$monitorCount} monitors`);
    }

    if (parts.length === 0) return "";

    return `Loaded ${formatList(parts)}`;
  }
);

/**
 * Derived store for the "Waiting for ..." status text.
 *
 * Example:
 *   "Waiting for monitor data, PurpleAir data, and CalFire fire data..."
 *
 * Empty string if we aren't waiting on anything (all counts > 0).
 */
export const waitingStatusText = derived(
  [
    monitorCount,
  ],
  ([
    $monitorCount,
  ]) => {
    const waiting = [];

    if ($monitorCount === 0) {
      waiting.push("monitor data");
    }

    if (waiting.length === 0) return "";

    return `Waiting for ${formatList(waiting)}...`;
  }
);
