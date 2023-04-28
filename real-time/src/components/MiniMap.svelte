<script>
// Exports
//export let element_id = 'default-mini-map';
export let width = '400px';
export let height = '300px';

// Imports
// Svelte methods
import { afterUpdate, onDestroy } from 'svelte';
// Svelte stores
import { all_monitors } from '../stores/monitor-data-store.js';
import { selected_id } from '../stores/gui-store.js';

// We need these variables to live on after an individual chart is destroyed
let map;

async function createMap() {

  if (map) map.remove();

  // Create the map
  map = L.map('map1').setView(
    [
      $all_monitors.getMetadata($selected_id, 'latitude'),
      $all_monitors.getMetadata($selected_id, 'longitude')
    ],
    10);

  // Add background tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

}

// Regenerate the chart after any update
afterUpdate(createMap);

onDestroy(() => {
  if (map) map.remove();
});
</script>

<svelte:head>
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
  integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI="
  crossorigin=""
/>
</svelte:head>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="map1"
    style="width: {width}; height: {height};">
</div>

<style>

</style>

