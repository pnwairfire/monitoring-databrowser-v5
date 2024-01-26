<script>
// Exports
export let element_id = 'default-mini-map';
export let width = '180px';
export let height = '180px';
export let id = '';
export let deviceType = 'monitor';

// Imports
// Svelte methods
import { afterUpdate, onDestroy } from 'svelte';
// Svelte stores
import { all_monitors } from '../stores/monitor-data-store.js';
import { pas } from '../stores/purpleair-data-store.js';

// We need these variables to live on after an individual chart is destroyed
let map;

async function createMap() {

  if (map) map.remove();

  let latLng;

  if (deviceType === "monitor") {

    latLng = [
      $all_monitors.getMetadata(id, 'latitude'),
      $all_monitors.getMetadata(id, 'longitude')
    ];

  } else if (deviceType === "purpleair") {

    let site = $pas.filter(o => o.sensor_index == id)[0]
    latLng = [
      site.latitude,
      site.longitude
    ];

  }

  // Create the map
  map = L.map(element_id, {
      zoomControl: false,
      boxZoom: false,
      doubleClickZoom: false,
      dragging: false,
      zoomAnimation: false,
      scrollWheelZoom: false,
      touchZoom: false,
  }).setView(latLng, 10);

  // Add background tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    //attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Add marker
  L.marker(latLng).addTo(map);

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
<div id="{element_id}"
    style="width: {width}; height: {height};">
</div>

<style>
  /*
  * Default height is 180 rather than 200 for the plots.
  */
  div {
    margin-top: 20px;
  }
</style>

