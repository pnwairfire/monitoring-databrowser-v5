<script>
	// Exports
  export let width = '400px';
  export let height = '400px';

  // Imports
  // Svelte methods
	import { onMount, onDestroy } from 'svelte';
  // Svelte stores
  import { all_monitors } from '../stores/monitor-data-store.js';
  import { selected_id } from '../stores/gui-store.js';
  // Leaflet (NOTE:  Don't put {} around the 'L'!)
  import L from "leaflet";
  // Plotting helper functions
  import { pm25ToColor } from 'air-monitor-plots';

  let map;

  function createMap() {

    // Get a copy of the reactive data and id
    const monitor = $all_monitors;

    // Create the map
    map = L.map('map').setView([40, -120], 8);

    // Add background tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Create and add geojson created from
    let monitorGeoJSON = monitor.createGeoJSON();
    createMonitorLayer(monitorGeoJSON).addTo(map);

  }

	onMount(createMap);

	onDestroy(() => {
		if (map) map.remove();
	});

  /**
   * @param {geojson} geojson to be converted to a leaflet layer
   * @returns
   */
  function createMonitorLayer(geojson) {
    var this_layer = L.geoJSON(geojson, {
      // Icon appearance
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: pm25ToColor(feature.properties.last_pm25),
          color: '#000',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        });
      },

      // Icon behavior
      onEachFeature: function (feature, layer) {
        let valueText;
        if (isNaN(feature.properties.last_pm25)) {
          valueText = "<span style='font-style:italic'> no data</span>";
        } else {
          valueText = feature.properties.last_pm25 + ' &#xb5;g/m<sup>3</sup>';
        }
        layer.bindPopup(feature.properties.locationName + '<br>' + valueText);

        layer.on('mouseover', function (e) {
          $selected_id = feature.properties.deviceDeploymentID;
          // this.openPopup();
        });

        layer.on('mouseout', function (e) {
          // this.closePopup();
        });

        // layer.on('click', function (e) {
        //   selected_id.set(feature.properties.deviceDeploymentID);
        // });
      }
    });
    return this_layer;
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