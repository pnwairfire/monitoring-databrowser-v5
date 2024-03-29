<script>
	// Exports
  export let width = '400px';
  export let height = '400px';

  // Imports
  // Svelte methods
	import { onMount, onDestroy } from 'svelte';
  // monitor-data-store
  import {
    // all_monitors,
    airsis_geojson,
  } from '../stores/monitor-data-store.js';
  // gui-store
  import {
    centerLat,
    centerLon,
    zoom,
    selected_id,
    map_update_needed,
  } from '../stores/gui-store.js';
  // Leaflet (NOTE:  Don't put {} around the 'L'!)
  import L from "leaflet";
  // Extra shape makers
  //  - https://npm.io/package/leaflet-svg-shape-markers
  import 'leaflet-svg-shape-markers';
  // Plotting helper functions
  import {
    monitorPropertiesToIconOptions,
  } from '../js/utils-map.js';
  import { replaceWindowHistory } from '../js/utils.js';

  let map;

  async function createMap() {

    // Get a copy of the reactive data
    // const monitor = $all_monitors;

    // Create the map
    map = L.map('map').setView([$centerLat, $centerLon], $zoom);

    // Add background tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    airsis_geojson.load().then(function(geojsonData) {
      createMonitorLayer(geojsonData).addTo(map);
    });

    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_id);

    // Add event listeners to the map
    map.on("mouseover", function() {
      let dummy = 1;
    })

    map.on("moveend", function() {
      $centerLat = map.getCenter().lat;
      $centerLon = map.getCenter().lng;
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_id);
    })

    map.on("zoomend", function() {
      $zoom = map.getZoom();
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_id);
    })

  }

	onMount(createMap);

	onDestroy(() => {
		if (map) map.remove();
	});

  /* ----- Monitor functions ------------------------------------------------ */

  /**
   * @param {geojson} geojson to be converted to a leaflet layer
   * @returns
   */
  function createMonitorLayer(geojson) {
    var this_layer = L.geoJSON(geojson, {
      // Icon appearance
      pointToLayer: function (feature, latlng) {
        // TODO:  This is where I can filter for Susan's JBLM research monitors -- only make these visible
        if ( feature.properties.deviceDeploymentID.indexOf("_pnwusfs") !== -1 ) {

          // Only show markers if the latency is less than 3 * 24 hours
          if ( parseInt(feature.properties.last_latency) < 24 * 3) {
            let marker = L.shapeMarker(latlng, monitorPropertiesToIconOptions(feature.properties));
            // https://stackoverflow.com/questions/34322864/finding-a-specific-layer-in-a-leaflet-layergroup-where-layers-are-polygons
            marker.id = feature.properties.deviceDeploymentID;
            // // //marker.setStyle({"zIndexOffset": feature.properties.last_nowcast * 10})
            if ($selected_id === marker.id) {
              marker.setStyle({weight: 3});
            } else {
              marker.setStyle({weight: 1});
            }
            return(marker);
          }

        }
      },

      // Icon behavior
      onEachFeature: function (feature, layer) {
        layer.on('click', function (e) {
          monitorIconClick(e);
        });
      }
    });
    return this_layer;
  }

  // Monitor icon click behavior
  function monitorIconClick(e) {
    const feature = e.target.feature;
    const id = feature.properties.deviceDeploymentID;
    if (id === $selected_id) {
      $selected_id = "";
    } else {
      $selected_id = id;
    }
    highlightMonitors(map);
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_id);
  }

  // Highlight selected monitors
  function highlightMonitors(map) {
    map.eachLayer(function(layer) {
      // Bold or un-bold each ShapeMarker
      if (layer instanceof L.ShapeMarker) {
        if ($selected_id === layer.id) {
          layer.setStyle({weight: 3});
        } else {
          layer.setStyle({weight: 1});
        }
      }
    })
  }

  /* ----- Other functions -------------------------------------------------- */

  // Watcher for map update requests from external components
  $: if ($map_update_needed) {
    highlightMonitors(map);
    $map_update_needed = false;
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_id);
  }
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
<div id="map"
      style="width: {width}; height: {height};">
</div>

<style>

</style>