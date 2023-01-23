import { writable } from 'svelte/store';

// GUI state with user selections
export let selected_plot_type = writable('');
export let selected_id = writable('');
