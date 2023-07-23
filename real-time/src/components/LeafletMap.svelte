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
    airnow_geojson,
    airsis_geojson,
    wrcc_geojson,
  } from '../stores/monitor-data-store.js';
  // sensor-data-store
  import {
    pas,
    patCart
  } from '../stores/sensor-data-store.js';
  // patCart
  // import { patCart } from '../stores/patCart.js';
  // gui-store
  import {
    centerLat,
    centerLon,
    zoom,
    hovered_id,
    hovered_sensor_id,
    selected_ids,
    selected_sensor_ids,
    unselected_id,
    unselected_sensor_id,
    use_hovered_sensor,
    current_slide,
  } from '../stores/gui-store.js';

  import { getPurpleAirData } from '../js/utils-sensor.js';

  // Leaflet (NOTE:  Don't put {} around the 'L'!)
  import L from "leaflet";
  // Extra shape makers
  //  - https://npm.io/package/leaflet-svg-shape-markers
  import 'leaflet-svg-shape-markers';

  // Plotting helper functions
  import {
    monitorPropertiesToIconOptions,
    sensorCreateGeoJSON,
    sensorPropertiesToIconOptions,
  } from '../js/utils-map.js';
  import { replaceWindowHistory } from '../js/utils.js';

  let map;
  let airnow_layer;
  let airsis_layer;
  let wrcc_layer;
  let sensor_layer;

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

    // Add sensors to the map, always at the bottom of the layer stack
    pas.load().then(function(synopticData) {
      let geojsonData = sensorCreateGeoJSON(synopticData);
      createSensorLayer(geojsonData).bringToBack().addTo(map);
    });

    // Add monitors to the map
    airnow_geojson.load().then(function(geojsonData) {
      // createMonitorLayer(geojsonData).addTo(map);
      airnow_layer = createMonitorLayer(geojsonData);
      airnow_layer.addTo(map);
    });

    airsis_geojson.load().then(function(geojsonData) {
      // createMonitorLayer(geojsonData).addTo(map);
      airsis_layer = createMonitorLayer(geojsonData);
      airsis_layer.addTo(map);
    });

    wrcc_geojson.load().then(function(geojsonData) {
      // createMonitorLayer(geojsonData).addTo(map);
      wrcc_layer = createMonitorLayer(geojsonData);
      wrcc_layer.addTo(map);
    });

    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);

    // Add event listeners to the map
    map.on("mouseover", function() {
      $current_slide = "hourly";
    })

    map.on("moveend", function() {
      $centerLat = map.getCenter().lat;
      $centerLon = map.getCenter().lng;
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
    })

    map.on("zoomend", function() {
      $zoom = map.getZoom();
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
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
        // TODO:  This is where I can filter for Susan's JBLM research monitors -- only show non-matches
        if ( feature.properties.deviceDeploymentID.indexOf("_pnwusfs") === -1 ) {

          // Only show markers if the latency is less than 3 * 24 hours
          if ( parseInt(feature.properties.last_latency) < 24 * 3) {
            let marker = L.shapeMarker(latlng, monitorPropertiesToIconOptions(feature.properties));
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

        }
      },

      // Icon behavior
      onEachFeature: function (feature, layer) {
        layer.on('mouseover', function (e) {
          $use_hovered_sensor = false;
          $hovered_id = feature.properties.deviceDeploymentID;
        });
        layer.on('mouseout', function (e) {
          $hovered_id = "";
        });
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
    const found = $selected_ids.find((o) => o == id);
    if (!found) {
      const ids = $selected_ids;
      const length = ids.unshift(id);
      $selected_ids = ids;
      e.target.setStyle({ weight: 3 });
    } else {
      const ids = $selected_ids;
      const index = ids.indexOf(id);
      const removedItem = ids.splice(index, 1);
      $selected_ids = ids;
      e.target.setStyle({ weight: 1 });
    }
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
  }

  /* ----- Sensor functions ------------------------------------------------- */

  function createSensorLayer(geojson) {
    var this_layer = L.geoJSON(geojson, {
      // Icon appearance
      pointToLayer: function (feature, latlng) {
        // Only show markers if the latency is less than 3 * 24 hours
        if ( parseInt(feature.properties.latency) < 24 * 3) {
          let marker = L.shapeMarker(latlng, sensorPropertiesToIconOptions(feature.properties));
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
          $hovered_sensor_id = feature.properties.deviceDeploymentID;
          $use_hovered_sensor = true;
        });
        layer.on('mouseout', function (e) {
          $hovered_sensor_id = "";
          $use_hovered_sensor = false;
        });
        layer.on('click', function (e) {
          // $use_hovered_sensor = true;
          sensorIconClick(e);
        });
      }
    });
    return this_layer;
  }

  // Sensor icon click behavior
  async function sensorIconClick(e) {
    const feature = e.target.feature;
    const id = feature.properties.deviceDeploymentID;
    const found = $selected_sensor_ids.find((o) => o == id);

    if (!found) {

      // Load pat data
      const index = $patCart.items.findIndex((item) => item.id === id);
      if (index !== -1) {
        console.log("pat id: " + id + " is already loaded.");
      } else {
        console.log("Downloading sensor data for id = " + id);
        let sensorData = await getPurpleAirData(id);
        const pa_object = { id: id, data: sensorData };
        patCart.addItem(pa_object);
      }
      console.log("patCart.count = " + $patCart.count);
      // Now update selected_sensor_ids
      const ids = $selected_sensor_ids;
      const length = ids.unshift(id);
      $selected_sensor_ids = ids;
      e.target.setStyle({opacity: 1.0, weight: 2});

    } else {

      // TODO:  Should we unload pat data?
      const ids = $selected_sensor_ids;
      const index = ids.indexOf(id);
      const removedItem = ids.splice(index, 1);
      $selected_sensor_ids = ids;
      e.target.setStyle({opacity: 0.2, weight: 1});

    }

    // TODO:  Figure out replaceWindowHistory with sensor ids
    // replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);

  }

  /* ----- Other functions -------------------------------------------------- */

  // Watcher for map-external monitor deselect events
  $: if ($unselected_id !== "") {
    map.eachLayer(function(layer) {
      if (layer instanceof L.ShapeMarker) {
        if (layer.id == $unselected_id) {
          layer.setStyle({weight: 1});
          $unselected_id = "";
        }
      }
    })
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
  }

  // Watcher for map-external sensor deselect events
  $: if ($unselected_sensor_id !== "") {
    map.eachLayer(function(layer) {
      if (layer instanceof L.ShapeMarker) {
        if (layer.id == $unselected_sensor_id) {
          layer.setStyle({weight: 1});
          $unselected_sensor_id = "";
        }
      }
    })
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