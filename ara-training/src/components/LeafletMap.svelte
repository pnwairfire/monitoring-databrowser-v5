<script>
	// Exports
  export let width = '400px';
  export let height = '400px';


  // Svelte methods
	import { onMount, onDestroy } from 'svelte';

  // Stores
  import {
    airnow_geojson,
    airsis_geojson,
    wrcc_geojson,
  } from '../stores/monitor-data-store.js';

  import { pas, patCart } from '../stores/purpleair-data-store.js';

  import { clarity, clarity_geojson } from '../stores/clarity-data-store.js';

  //import { hms_fires_geojson, hms_smoke_geojson } from '../stores/hms-data-store.js';
  import { hms_fires_csv, hms_smoke_geojson } from '../stores/hms-data-store.js';

  import {
    centerLat,
    centerLon,
    zoom,
    hovered_monitor_id,
    hovered_purpleair_id,
    hovered_clarity_id,
    selected_monitor_ids,
    selected_purpleair_ids,
    selected_clarity_ids,
    unselected_monitor_id,
    unselected_purpleair_id,
    unselected_clarity_id,
    use_hovered_purpleair,
    use_hovered_clarity,
    current_slide,
  } from '../stores/gui-store.js';

  // Leaflet (NOTE:  Don't put {} around the 'L'!)
  import L from "leaflet";
  // Extra shape makers
  //  - https://npm.io/package/leaflet-svg-shape-markers
  import 'leaflet-svg-shape-markers';
  import { basemapLayer } from 'esri-leaflet';

  // Plotting helper functions
  import {
    monitorPropertiesToIconOptions,
    purpleairCreateGeoJSON,
    purpleairPropertiesToIconOptions,
    clarityPropertiesToIconOptions,
  } from '../js/utils-map.js';

  // Utility functions
  import { getPurpleAirData } from '../js/utils-purpleair.js';
  import { replaceWindowHistory } from '../js/utils.js';

  // TODO:  Status text could say how old the map data is.

  // Reload geojson data every 10 minutes
  setInterval(() => {
    airnow_geojson.reload();
    airsis_geojson.reload();
    wrcc_geojson.reload();
    // clarity.reload();
    // pas.reload();
    // Wait 10 seconds for all data to load before recreating the map
    setTimeout(() => {
      map.remove();
      createMap();
    }, 1000 * 10)   // 10 seconds
  }, 1000 * 60 * 10) // 10 minutes

  let map;

  async function createMap() {

    // Create the map
    map = L.map('map').setView([$centerLat, $centerLon], $zoom);

    // Add background tiles
    basemapLayer('Topographic').addTo(map);

    let HMSFiresLayer, HMSSmokeLayer;
    let PurpleAirLayer, ClarityLayer;
    let AirNowLayer, AIRSISLayer, WRCCLayer;

    // Create the smoke polygons layer
    // hms_smoke_geojson.load().then(function(geojsonData) {
    //   HMSSmokeLayer = createHMSSmokeLayer(geojsonData);
    // });

    // Create the PurpleAir layer
    // pas.load().then(function(synopticData) {
    //   let geojsonData = purpleairCreateGeoJSON(synopticData);
    //   PurpleAirLayer = createPurpleAirLayer(geojsonData);
    // });

    // Create the Clarity layer
    // clarity_geojson.load().then(function(geojsonData) {
    //   ClarityLayer = createClarityLayer(geojsonData);
    // });

    // Create the AirNow layer
    airnow_geojson.load().then(function(geojsonData) {
      AirNowLayer = createMonitorLayer(geojsonData);
    });

    // Create the AIRSIS layer
    airsis_geojson.load().then(function(geojsonData) {
      AIRSISLayer = createMonitorLayer(geojsonData);
    });

    // Create the WRCC layer
    wrcc_geojson.load().then(function(geojsonData) {
      WRCCLayer = createMonitorLayer(geojsonData);
    });

    // Add layers in desired order after each has loaded
    // await hms_smoke_geojson.load();
    // HMSSmokeLayer.addTo(map);

    // Add HMS Fires to the map so it's on the bottom
    // hms_fires_csv.load().then(function(csvData) {
    //   let a = 1;
    //   console.log(csvData.length)
    //   HMSFiresLayer = createHMSFiresLayer_csv(csvData);
    // });

    // await clarity_geojson.load();
    // ClarityLayer.addTo(map);

    // await pas.load();
    // PurpleAirLayer.addTo(map);

    await airsis_geojson.load();
    AIRSISLayer.addTo(map);

    await wrcc_geojson.load();
    WRCCLayer.addTo(map);

    await airnow_geojson.load();
    AirNowLayer.addTo(map);


    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);

    // ----- Add event listeners to the map ------------------------------------

    // Force selected monitors/sensors to show hourly plot when interacting with the map
    map.on("mouseover", function() {
      $current_slide = "hourly";
    })

    // Update browser URL when panning
    map.on("moveend", function() {
      $centerLat = map.getCenter().lat;
      $centerLon = map.getCenter().lng;
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);
    })

    // Update browser URL when zooming
    map.on("zoomend", function() {
      $zoom = map.getZoom();
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);
    })

    // Ensure "hovered" plot is not shown after leaving the map
    map.on('mouseout', function () {
      $hovered_monitor_id = "";
      $hovered_purpleair_id = "";
      $hovered_clarity_id = "";
      $use_hovered_purpleair = false;
      $use_hovered_clarity = false;
    });

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
    let this_layer = L.geoJSON(geojson, {
      // Icon appearance
      pointToLayer: function (feature, latlng) {
        // NOTE:  This is where I filter for Susan's JBLM research monitors -- only show non-matches
        if ( feature.properties.deviceDeploymentID.indexOf("_pnwusfs") === -1 ) {

          // Only show markers if the latency is less than 3 * 24 hours
          if ( parseInt(feature.properties.last_latency) < 24 * 3) {
            let marker = L.shapeMarker(latlng, monitorPropertiesToIconOptions(feature.properties));
            // https://stackoverflow.com/questions/34322864/finding-a-specific-layer-in-a-leaflet-layergroup-where-layers-are-polygons
            marker.id = feature.properties.deviceDeploymentID.toString();
            // // //marker.setStyle({"zIndexOffset": feature.properties.last_nowcast * 10})
            if ($selected_monitor_ids.find(o => o === marker.id)) {
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
          $use_hovered_purpleair = false;
          $use_hovered_clarity = false;
          $hovered_monitor_id = feature.properties.deviceDeploymentID;
        });
        layer.on('mouseout', function (e) {
          $hovered_monitor_id = "";
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
    const found = $selected_monitor_ids.find((o) => o == id);
    if (!found) {
      const ids = $selected_monitor_ids;
      const length = ids.unshift(id);
      $selected_monitor_ids = ids;
      e.target.setStyle({weight: 3});
    } else {
      const ids = $selected_monitor_ids;
      const index = ids.indexOf(id);
      const removedItem = ids.splice(index, 1);
      $selected_monitor_ids = ids;
      e.target.setStyle({weight: 1});
    }
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);
  }

  /* ----- PurpleAir functions ---------------------------------------------- */

  function createPurpleAirLayer(geojson) {
    let this_layer = L.geoJSON(geojson, {
      // Icon appearance
      pointToLayer: function (feature, latlng) {
        // Only show markers if the latency is less than 3 * 24 hours
        if ( parseInt(feature.properties.latency) < 24 * 3) {
          let marker = L.shapeMarker(latlng, purpleairPropertiesToIconOptions(feature.properties));
          // https://stackoverflow.com/questions/34322864/finding-a-specific-layer-in-a-leaflet-layergroup-where-layers-are-polygons
          marker.id = feature.properties.deviceDeploymentID.toString();
          // // //marker.setStyle({"zIndexOffset": feature.properties.last_nowcast * 10})
          if ($selected_purpleair_ids.find(o => o === marker.id)) {
            marker.setStyle({opacity: 1.0, weight: 2});
          } else {
            marker.setStyle({opacity: 0.2, weight: 1});
          }
          return(marker);
        }
      },

      // Icon behavior
      onEachFeature: function (feature, layer) {
        layer.on('mouseover', function (e) {
          $hovered_purpleair_id = feature.properties.deviceDeploymentID;
          $use_hovered_purpleair = true;
        });
        layer.on('mouseout', function (e) {
          $hovered_purpleair_id = "";
          $use_hovered_purpleair = false;
        });
        layer.on('click', function (e) {
          // $use_hovered_purpleair = true;
          purpleairIconClick(e);
        });
      }
    });
    return this_layer;
  }

  // Sensor icon click behavior
  async function purpleairIconClick(e) {
    const feature = e.target.feature;
    const id = feature.properties.deviceDeploymentID;
    const found = $selected_purpleair_ids.find((o) => o == id);

    if (!found) {

      // Load pat data
      const index = $patCart.items.findIndex((item) => item.id === id);
      if (index !== -1) {
        console.log("pat id: " + id + " is already loaded.");
      } else {
        console.log("Downloading PurpleAir data for id = " + id);
        let purpleairData = await getPurpleAirData(id);
        const pa_object = { id: id, data: purpleairData };
        patCart.addItem(pa_object);
      }
      console.log("patCart.count = " + $patCart.count);
      // Now update selected_purpleair_ids
      const ids = $selected_purpleair_ids;
      const length = ids.unshift(id);
      $selected_purpleair_ids = ids;
      e.target.setStyle({opacity: 1.0, weight: 2});

    } else {

      // TODO:  Should we unload pat data?
      const ids = $selected_purpleair_ids;
      const index = ids.indexOf(id);
      const removedItem = ids.splice(index, 1);
      $selected_purpleair_ids = ids;
      e.target.setStyle({opacity: 0.2, weight: 1});

    }

    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);

  }

  /* ----- Clarity functions ------------------------------------------------ */

  /**
   * @param {geojson} geojson to be converted to a leaflet layer
   * @returns
   */
   function createClarityLayer(geojson) {
    let this_layer = L.geoJSON(geojson, {
      // Icon appearance
      pointToLayer: function (feature, latlng) {
        // Only show markers if the latency is less than 3 * 24 hours
        if ( parseInt(feature.properties.last_latency) < 24 * 3) {
          let marker = L.shapeMarker(latlng, clarityPropertiesToIconOptions(feature.properties));
          // https://stackoverflow.com/questions/34322864/finding-a-specific-layer-in-a-leaflet-layergroup-where-layers-are-polygons
          marker.id = feature.properties.deviceDeploymentID.toString();
          // // //marker.setStyle({"zIndexOffset": feature.properties.last_nowcast * 10})
          if ($selected_clarity_ids.find(o => o === marker.id)) {
            marker.setStyle({opacity: 1.0, weight: 2});
          } else {
            marker.setStyle({opacity: 0.2, weight: 1});
          }
          return(marker);
        }
      },

      // Icon behavior
      onEachFeature: function (feature, layer) {
        layer.on('mouseover', function (e) {
          $hovered_clarity_id = feature.properties.deviceDeploymentID;
          $use_hovered_clarity = true;
        });
        layer.on('mouseout', function (e) {
          $hovered_clarity_id = "";
          $use_hovered_clarity = false;
        });
        layer.on('click', function (e) {
          // $use_hovered_clarity = true;
          clarityIconClick(e);
        });
      }
    });
    return this_layer;
  }

  // Monitor icon click behavior
  function clarityIconClick(e) {
    const feature = e.target.feature;
    const id = feature.properties.deviceDeploymentID;
    const found = $selected_clarity_ids.find((o) => o == id);
    if (!found) {
      const ids = $selected_clarity_ids;
      const length = ids.unshift(id);
      $selected_clarity_ids = ids;
      e.target.setStyle({opacity: 1.0, weight: 2});
    } else {
      const ids = $selected_clarity_ids;
      const index = ids.indexOf(id);
      const removedItem = ids.splice(index, 1);
      $selected_clarity_ids = ids;
      e.target.setStyle({opacity: 0.2, weight: 1});
    }
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);
  }

  /* ----- HMS functions ---------------------------------------------------- */

   /**
   * @param {csv} csv to be converted to a leaflet layer
   * @returns
   */
   function createHMSFiresLayer_csv(csv) {

    let this_layer = L.canvas({ padding: 0.5 })

    for (var i = 0; i < csv.length; i += 1) { // 100k points
      L.circleMarker([csv[i].latitude, csv[i].longitude], {
        renderer: this_layer,
        radius: 3,
        fillColor: '#d7721c',
        fillOpacity: 0.5,
        weight: 1.5,
        color: "#e9c28f",
        opacity: 0.5,
      }).addTo(map);
    }

    return this_layer;
  }

  /**
   * @param {geojson} geojson to be converted to a leaflet layer
   * @returns
   */
   function createHMSSmokeLayer(geojson) {
    let this_layer = L.geoJSON(geojson, {
      style: function style(feature) {
        return {
            fillColor: 'gray',
            weight: 1,
            opacity: 0.5,
            color: 'gray',
            fillOpacity: 0.15
        };
      }
    });
    return this_layer;
  }

  /* ----- Other functions -------------------------------------------------- */

  // Watcher for map-external monitor deselect events
  $: if ($unselected_monitor_id !== "") {
    map.eachLayer(function(layer) {
      if (layer instanceof L.ShapeMarker) {
        if (layer.id == $unselected_monitor_id) {
          layer.setStyle({weight: 1});
          $unselected_monitor_id = "";
        }
      }
    })
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);
  }

  // Watcher for map-external sensor deselect events
  $: if ($unselected_purpleair_id !== "") {
    map.eachLayer(function(layer) {
      if (layer instanceof L.ShapeMarker) {
        if (layer.id == $unselected_purpleair_id) {
          layer.setStyle({opacity: 0.2, weight: 1});
          $unselected_purpleair_id = "";
        }
      }
    })
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);
  }

  // Watcher for map-external sensor deselect events
  $: if ($unselected_clarity_id !== "") {
    map.eachLayer(function(layer) {
      if (layer instanceof L.ShapeMarker) {
        if (layer.id == $unselected_clarity_id) {
          layer.setStyle({opacity: 0.2, weight: 1});
          $unselected_clarity_id = "";
        }
      }
    })
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids, $selected_purpleair_ids, $selected_clarity_ids);
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