import { readable, writable, derived } from "svelte/store";
import { DateTime } from "luxon";

// Version 5.5.0 = v5 . package update refactor . CalFire layer
export const VERSION = readable("5.5.7");

// Status messages
export const error_message = writable("");
export const monitorCount = writable(0);
export const purpleairCount = writable(0);
export const clarityCount = writable(0);
export const hmsFiresCount = writable(0);
export const inciwebFireCount = writable(0);
export const calfireFireCount = writable(0);

// GUI state for the leaflet map
export let centerLon = writable(-100);
export let centerLat = writable(40);
export let zoom = writable(4);
export const mapLastUpdated = writable(null); // or writable(DateTime.now())

// GUI state for user selections
export let hovered_monitor_id = writable("");
export let selected_monitor_ids = writable([]);
export let unselected_monitor_id = writable("");

export let hovered_purpleair_id = writable("");
export let selected_purpleair_ids = writable([]);
export let unselected_purpleair_id = writable("");

export let hovered_clarity_id = writable("");
export let selected_clarity_ids = writable([]);
export let unselected_clarity_id = writable("");

export let map_update_needed = writable(false);

export let use_hovered_purpleair = writable(false);
export let use_hovered_clarity = writable(false);

export let current_slide = writable("all");

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
    purpleairCount,
    clarityCount,
    hmsFiresCount,
    inciwebFireCount,
    calfireFireCount,
  ],
  ([
    $monitorCount,
    $purpleairCount,
    $clarityCount,
    $hmsFiresCount,
    $inciwebFireCount,
    $calfireFireCount,
  ]) => {
    const parts = [];

    if ($monitorCount > 0) {
      parts.push(`${$monitorCount} monitors`);
    }
    if ($purpleairCount > 0) {
      parts.push(`${$purpleairCount} PurpleAir sensors`);
    }
    if ($clarityCount > 0) {
      parts.push(`${$clarityCount} Clarity sensors`);
    }
    if ($hmsFiresCount > 0) {
      parts.push(`${$hmsFiresCount} HMS fire detections`);
    }
    if ($inciwebFireCount > 0) {
      parts.push(`${$inciwebFireCount} InciWeb incidents`);
    }
    if ($calfireFireCount > 0) {
      parts.push(`${$calfireFireCount} CalFire incidents`);
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
    purpleairCount,
    clarityCount,
    hmsFiresCount,
    inciwebFireCount,
    calfireFireCount,
  ],
  ([
    $monitorCount,
    $purpleairCount,
    $clarityCount,
    $hmsFiresCount,
    $inciwebFireCount,
    $calfireFireCount,
  ]) => {
    const waiting = [];

    if ($monitorCount === 0) {
      waiting.push("monitor data");
    }
    if ($purpleairCount === 0) {
      waiting.push("PurpleAir data");
    }
    if ($clarityCount === 0) {
      waiting.push("Clarity data");
    }
    if ($hmsFiresCount === 0) {
      waiting.push("HMS fire data");
    }
    if ($inciwebFireCount === 0) {
      waiting.push("InciWeb fire data");
    }
    if ($calfireFireCount === 0) {
      waiting.push("CalFire fire data");
    }

    if (waiting.length === 0) return "";

    return `Waiting for ${formatList(waiting)}...`;
  }
);
