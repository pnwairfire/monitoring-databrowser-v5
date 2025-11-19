<script>
	// Exports
  export let width = '400px';
  export let height = '400px';

  // Svelte methods
	import { onMount, onDestroy } from 'svelte';

  // Leaflet (NOTE:  Don't put {} around the 'L'!)
  import L from "leaflet";
  import 'leaflet-svg-shape-markers';
  import { basemapLayer } from 'esri-leaflet';

  import { DateTime } from 'luxon';

  // Stores
  import {
    airnow_geojson,
  } from '../stores/monitor-data-store.js';
  import { mapLastUpdated } from '../stores/gui-store.js';

  import {
    centerLat,
    centerLon,
    zoom,
    exclusion_ids,
    hovered_monitor_id,
    selected_monitor_ids,
    unselected_monitor_id,
  } from '../stores/gui-store.js';

  // Plotting helper functions
  import {
    monitorPropertiesToIconOptions,
  } from '../js/utils-map.js';

  // Utility functions
  import { replaceWindowHistory } from '../js/utils.js';

  let map;
  let refreshInterval;

  // Layers are created in the map initialization section.
  let layers = {};
  let unsubscribers = [];

  // Enforce stacking order (bottom to top)
  function enforceLayerGroupOrder() {
    layers.airnow?.bringToFront?.();
  }

  /**
   * Replaces the contents of a Leaflet LayerGroup with a new layer.
   *
   * This is useful when you're updating data reactively (e.g., from a Svelte store)
   * but want to keep the original LayerGroup instance attached to the map and toggle control.
   *
   * @param {L.LayerGroup} layerGroup - The Leaflet LayerGroup to update.
   * @param {L.Layer} newLayer - The new Leaflet layer to insert.
   */
  function replaceLayerContent(layerGroup, newContent) {
    if (!layerGroup || typeof layerGroup.clearLayers !== 'function') {
      console.warn("Invalid layerGroup passed to replaceLayerContent");
      return;
    }

    layerGroup.clearLayers();

    if (Array.isArray(newContent)) {
      newContent.forEach(layer => layerGroup.addLayer(layer));
    } else if (newContent) {
      layerGroup.addLayer(newContent);
    }
  }

  onMount(() => {
    createMap();
  });

  onDestroy(() => {
    if (map) map.remove();
    if (refreshInterval) clearInterval(refreshInterval);
    unsubscribers.forEach((fn) => fn()); // clean up Svelte store subscriptions
  });

  async function createMap() {

    // Initialize the map
    map = L.map('map').setView([$centerLat, $centerLon], $zoom);
    basemapLayer('Topographic').addTo(map);

    // ----- Add layers through subscriptions ----------------------------------

    /**
     * Helper to keep a Leaflet layer in sync with a Svelte store.
     *
     * Ensures that a layer group exists in `layers` for the given key,
     * then replaces its content whenever the store updates.
     *
     * @param {Readable<any>} store - Svelte store providing raw data (GeoJSON, CSV, etc.).
     * @param {Function} createFn - Function that builds a Leaflet layer from store value.
     * @param {string} key - Key into the `layers` object.
     * @param {L.Map} map - Leaflet map instance to attach the layer group to.
     */
    function watchLayer(store, createFn, key, map) {
      // Create the layer group lazily if missing
      if (!layers[key]) {
        layers[key] = L.layerGroup().addTo(map);
      }

      const unsubscribe = store.subscribe((data) => {
        const newLayer = data ? createFn(data) : null;
        replaceLayerContent(layers[key], newLayer);
        enforceLayerGroupOrder();
      });

      unsubscribers.push(unsubscribe); // auto-register for cleanup
    }

    // --- Watch all layers
    watchLayer(airnow_geojson, createMonitorLayer, "airnow", map);

    // Kick off initial load of all data that hasn't been loaded in App.svelte
    mapLastUpdated.set(DateTime.now());

    // Make layers toggleable
    L.control.layers(null, {
      "AirNow": layers.airnow,
    }).addTo(map);

    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids);

    // ----- Add lastUpdated custom control ------------------------------------

    let lastUpdatedDiv = L.control({ position: 'bottomright' });

    lastUpdatedDiv.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-control-latest-update');
      div.innerHTML = 'Last updated: ...';
      return div;
    };

    lastUpdatedDiv.addTo(map);

    // Subscribe to update time
    mapLastUpdated.subscribe((dt) => {
      if (dt && lastUpdatedDiv.getContainer()) {
        lastUpdatedDiv.getContainer().innerHTML =
          'Last updated: ' + dt.toFormat('h:mm a ZZZZ');
      }
    });

    // ----- Add event listeners to the map ------------------------------------

    // Update browser URL when panning
    map.on("moveend", function() {
      $centerLat = map.getCenter().lat;
      $centerLon = map.getCenter().lng;
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids);
    })

    // Update browser URL when zooming
    map.on("zoomend", function() {
      $zoom = map.getZoom();
      replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids);
    })

    // Ensure "hovered" plot is not shown after leaving the map
    map.on('mouseout', function () {
      $hovered_monitor_id = "";
    });

    // Ensure HMS polygons and fire points are at the bottom
    enforceLayerGroupOrder();
  }

  /* ------------------------------------------------------------------------ */
  /* -------------------------- End of Map ---------------------------------- */
  /* ------------------------------------------------------------------------ */

  /* ----- Monitor functions ------------------------------------------------ */

  /**
   * Creates a Leaflet GeoJSON layer for air quality monitors,
   * filtering out stale or excluded entries and applying interactive behavior.
   *
   * @param {Object} geojson - A GeoJSON FeatureCollection of monitor points.
   * @returns {L.GeoJSON} A Leaflet GeoJSON layer with custom markers and interactivity.
   */
  function createMonitorLayer(geojson) {
    const this_layer = L.geoJSON(geojson, {

      // Icon appearance
      pointToLayer: function (feature, latlng) {
        const props = feature.properties;
        const id = String(props.deviceDeploymentID);

        // Exclusion rules
        const isExcluded =
          id.includes("_pnwusfs") || // Skip JBLM research monitors
          $exclusion_ids.has(id) ||  // Skip runtime exclusion list
          parseInt(props.last_latency) >= 24 * 3; // Skip stale monitors

        if (isExcluded) return;

        const marker = L.shapeMarker(latlng, monitorPropertiesToIconOptions(props));
        const isSelected = $selected_monitor_ids.includes(id);
        marker.setStyle({ weight: isSelected ? 3 : 1 });

        return marker;
      },

      // Icon behavior
      onEachFeature: function (feature, layer) {
        layer.on('mouseover', function (e) {
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
    const id = e.target.feature.properties.deviceDeploymentID;
    const isSelected = $selected_monitor_ids.includes(id);

    if (isSelected) {
      // Remove it from selected_monitor_ids
      $selected_monitor_ids = $selected_monitor_ids.filter((x) => x !== id);
      e.target.setStyle({ weight: 1 });
    } else {
      // Add it to selected_monitor_ids
      $selected_monitor_ids = [id, ...$selected_monitor_ids];
      e.target.setStyle({ weight: 3 });
    }

    replaceWindowHistory($centerLat, $centerLon, $zoom, $selected_monitor_ids);
  }

  /* ----- Other functions -------------------------------------------------- */

  // Minimal helper: walk any Layer/FeatureGroup/GeoJSON tree
  function forEachLeaf(layerOrGroup, fn) {
    if (layerOrGroup && typeof layerOrGroup.eachLayer === 'function') {
      layerOrGroup.eachLayer(child => forEachLeaf(child, fn));
    } else if (layerOrGroup) {
      fn(layerOrGroup);
    }
  }

  // Watcher for map-external monitor deselect events (LayerGroup-aware)
  $: if ($unselected_monitor_id !== "") {
    if (layers?.airnow) {
      forEachLeaf(layers.airnow, (layer) => {
        // Only shape markers created by createMonitorLayer
        if (layer instanceof L.ShapeMarker &&
            layer.feature?.properties?.deviceDeploymentID === $unselected_monitor_id) {
          layer.setStyle({ weight: 1 });
        }
      });
    }

    // Clear the flag and update history
    $unselected_monitor_id = "";
    replaceWindowHistory(
      $centerLat, $centerLon, $zoom,
      $selected_monitor_ids
    );
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