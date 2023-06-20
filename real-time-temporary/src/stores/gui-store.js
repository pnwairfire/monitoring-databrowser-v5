import { readable, writable } from "svelte/store";

// Version
export const VERSION = readable("5.0.0");

// Status messages
export let error_message = writable("");

// GUI state for the leaflet map
export let centerLon = writable(-100);
export let centerLat = writable(40);
export let zoom = writable(4);
