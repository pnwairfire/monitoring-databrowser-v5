import { readable, writable } from "svelte/store";
import { DateTime } from 'luxon';

// Version 5.5.0 = v5 . package update refactor . fist pass
export const VERSION = readable("5.5.0");

// Status messages
export let error_message = writable("");
export let monitorCount = writable(0);
export let purpleairCount = writable(0);
export let clarityCount = writable(0);
export let hmsFiresCount = writable(0);

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

export let current_slide = writable("timeseries");
