import { readable, writable } from "svelte/store";

// Version
export const VERSION = readable("5.1.2");

// Status messages
export let error_message = writable("");

// GUI state for the leaflet map
export let centerLon = writable(-100);
export let centerLat = writable(40);
export let zoom = writable(4);

// GUI state with user selections
export let hovered_id = writable("");
export let hovered_sensor_id = writable("");
export let selected_ids = writable([]);
export let map_update_needed = writable(false);

export let use_hovered_sensor = writable(false);

export let current_slide = writable("all");
