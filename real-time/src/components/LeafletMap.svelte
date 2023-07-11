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
    airnow_geojson,
    airsis_geojson,
    wrcc_geojson,
  } from '../stores/monitor-data-store.js';
  import {
    pas,
  } from '../stores/sensor-data-store.js';
  import {
    centerLat,
    centerLon,
    zoom,
    hovered_id,
    hovered_sensor_id,
    selected_ids,
    map_update_needed,
    current_slide,
  } from '../stores/gui-store.js';
  // Leaflet (NOTE:  Don't put {} around the 'L'!)
  import L from "leaflet";
  // Extra shape makers
  //  - https://npm.io/package/leaflet-svg-shape-markers
  import 'leaflet-svg-shape-markers';
  // Plotting helper functions
  import { pm25ToColor } from 'air-monitor-plots';
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

    // Add sensors to the map
    pas.load().then(function(synopticData) {
      let geojsonData = createGeoJSON(synopticData);
      createSensorLayer(geojsonData).addTo(map);
    });

    // Add monitors to the map
    airnow_geojson.load().then(function(geojsonData) {
      createMonitorLayer(geojsonData).addTo(map);
    });

    airsis_geojson.load().then(function(geojsonData) {
      createMonitorLayer(geojsonData).addTo(map);
    });

    wrcc_geojson.load().then(function(geojsonData) {
      createMonitorLayer(geojsonData).addTo(map);
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
        layer.on('mouseout', function (e) {
          $hovered_id = "";
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
      const ids = $selected_ids;
      const length = ids.unshift(id);
      $selected_ids = ids;
      e.target.setStyle({weight: 3});
    } else {
      const ids = $selected_ids;
      const index = ids.indexOf(id)
      const removedItem = ids.splice(index, 1);
      $selected_ids = ids;
      e.target.setStyle({weight: 1});
    }
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
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
        });
        layer.on('mouseout', function (e) {
          $hovered_sensor_id = "";
        });
        layer.on('click', function (e) {
          sensorIconClick(e);
        });
      }
    });
    return this_layer;
  }

  function createGeoJSON(synopticData) {
    // 'pas' synopticData
    //
    // epa_nowcast: 7.7
    // epa_pm25: 7.2
    // latitude: 45.031963
    // longitude: -110.71382
    // raw_pm25: 4.4
    // sensor_index: 154193
    // timezone: "America/Denver"
    // utc_ts: "2023-07-11 21:00:00+0000"

    let features = Array(synopticData.length);

    let bop = 1;

    for (let i = 0; i < synopticData.length; i++) {
      let site = synopticData[i];
      features[i] = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [site.longitude, site.latitude],
        },
        properties: {
          deviceDeploymentID: site.sensor_index,
          locationName: "PurpleAir " + site.sensor_index,
          epa_nowcast: site.epa_nowcast,
          epa_pm25: site.epa_pm25,
          raw_pm25: site.raw_pm25,
          timezone: site.timezone,
          utc_ts: site.utc_ts,
          latency: (new Date() - new Date(site.utc_ts)) / (1000 * 3600),

        },
      };
    }

    let geojsonObj = {
      type: "FeatureCollection",
      features: features,
    };

    return geojsonObj;
  }

  // Monitor icon style
  function sensorPropertiesToIconOptions(properties) {
    const options = {
      radius: 4,
      shape: "square",
      fillColor: properties.latency > 4 ? "#bbb" : pm25ToColor(properties.epa_pm25),
      color: '#000',
      weight: 1,
      opacity: 0.2,
      fillOpacity: 0.6
    };
    return(options);
  }

  // Monitor icon behavior
  function sensorIconClick(e) {
    // const feature = e.target.feature;
    // const id = feature.properties.deviceDeploymentID;
    // const found = $selected_ids.find(o => o == id);
    // if (!found) {
    //   const ids = $selected_ids;
    //   const length = ids.unshift(id);
    //   $selected_ids = ids;
    //   e.target.setStyle({weight: 3});
    // } else {
    //   const ids = $selected_ids;
    //   const index = ids.indexOf(id)
    //   const removedItem = ids.splice(index, 1);
    //   $selected_ids = ids;
    //   e.target.setStyle({weight: 1});
    // }
    // replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
  }


  /* ----- Other functions -------------------------------------------------- */

  // Watcher for map update requests from external components
  $: if ($map_update_needed) {
    highlightMonitors(map);
    $map_update_needed = false;
    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_ids);
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