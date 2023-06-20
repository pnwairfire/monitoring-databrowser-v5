<script>
	// Exports
  export let width = '400px';
  export let height = '400px';

  // Imports
  // Svelte methods
	import { onMount, onDestroy } from 'svelte';
  // Svelte stores
  import {
    // all_monitors,
    airsis_geojson,
    wrcc_geojson,
  } from '../stores/monitor-data-store.js';
  import {
    hovered_id,
    selected_ids,
    map_update_needed,
    centerLat,
    centerLon,
    zoom
  } from '../stores/gui-store.js';
  // Leaflet (NOTE:  Don't put {} around the 'L'!)
  import L from "leaflet";
  // Extra shape makers
  //  - https://npm.io/package/leaflet-svg-shape-markers
  import 'leaflet-svg-shape-markers';
  // Plotting helper functions
  import { pm25ToColor } from 'air-monitor-plots';
  //import { replaceWindowHistory } from '../js/utils.js';

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

    // Add monitors to the map
    airsis_geojson.load().then(function(geojsonData) {
      createMonitorLayer(geojsonData).addTo(map);
    });

    wrcc_geojson.load().then(function(geojsonData) {
      createMonitorLayer(geojsonData).addTo(map);
    });

    // replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);

    // Add event listeners to the map
    map.on("moveend", function() {
      $centerLat = map.getCenter().lat;
      $centerLon = map.getCenter().lng;
      // replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
    })

    map.on("zoomend", function() {
      $zoom = map.getZoom();
      // replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
    })

  }

	onMount(createMap);

	onDestroy(() => {
		if (map) map.remove();
	});

  /* ----- Internal functions ----------------------------------------------- */

  /**
   * @param {geojson} geojson to be converted to a leaflet layer
   * @returns
   */
  function createMonitorLayer(geojson) {
    var this_layer = L.geoJSON(geojson, {
      // Icon appearance
      pointToLayer: function (feature, latlng) {
        // Only show markers if the latency is less than 3 * 24 hours
        if ( parseInt(feature.properties.last_latency) < 24 * 3) {
          let marker = L.shapeMarker(latlng, propertiesToIconOptions(feature.properties));
          // https://stackoverflow.com/questions/34322864/finding-a-specific-layer-in-a-leaflet-layergroup-where-layers-are-polygons
          marker.id = feature.properties.deviceDeploymentID;
          // // //marker.setStyle({"zIndexOffset": feature.properties.last_nowcast * 10})
          if ($selected_ids.find(o => o === marker.id)) {
            marker.setStyle({weight: 3});
          } else {
            marker.setStyle({weight: 1});
          }
          return(marker);
        }
      },

      // Icon behavior
      onEachFeature: function (feature, layer) {
        layer.on('mouseover', function (e) {
          $hovered_id = feature.properties.deviceDeploymentID;
        });
        layer.on('click', function (e) {
          iconClick(e);
        });
      }
    });
    return this_layer;
  }

  // Monitor icon style
  function propertiesToIconOptions(properties) {
    const latency = parseInt(properties['last_latency']);
    const options = {
      radius: properties['deploymentType'] == "Temporary" ? 7 : 8,
      shape: properties['deploymentType'] == "Temporary" ? "triangle-up" : "circle",
      fillColor: latency > 4 ? "#bbb" : pm25ToColor(properties['last_PM2.5']),
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    };
    return(options);
  }

  // Monitor icon behavior
  function iconClick(e) {
    const feature = e.target.feature;
    const id = feature.properties.deviceDeploymentID;
    const found = $selected_ids.find(o => o == id);
    if (!found) {
      $selected_ids[$selected_ids.length] = id;
      e.target.setStyle({weight: 3});
    } else {
      const ids = $selected_ids;
      const index = ids.indexOf(id)
      const removedItem = ids.splice(index, 1);
      $selected_ids = ids;
      e.target.setStyle({weight: 1});
    }
    // replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
  }

  // Highlight selected monitors
  function highlightMonitors(map) {
    map.eachLayer(function(layer) {
      // Bold or un-bold each ShapeMarker
      if (layer instanceof L.ShapeMarker) {
        if ($selected_ids.find(o => o === layer.id)) {
          layer.setStyle({weight: 3});
        } else {
          layer.setStyle({weight: 1});
        }
      }
    })
  }

  // Watcher for map update requests from external components
  $: if ($map_update_needed) {
    highlightMonitors(map);
    $map_update_needed = false;
    // replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
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