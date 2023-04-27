import { readable, writable } from "svelte/store";

// Version
export const VERSION = readable("0.0.1");

// GUI state with user selections
export let selected_plot_type = writable("");
export let selected_id = writable("");
