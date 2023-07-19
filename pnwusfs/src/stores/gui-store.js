import { readable, writable } from "svelte/store";

// Version
export const VERSION = readable("0.0.0");

// Status messages
export let error_message = writable("");

// GUI state for the leaflet map
export let centerLon = writable(-122.51);
export let centerLat = writable(47.02);
export let zoom = writable(10);

// GUI state with user selections
export let hovered_id = writable("");
export let selected_id = writable("");
export let map_update_needed = writable(false);
