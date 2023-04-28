<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';
  import {
		VERSION,
		selected_id,
		centerLon,
    centerLat,
    zoom
	} from './stores/gui-store.js';
  // Svelte Components
  import AlertBox from "./components/AlertBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
  import MetadataBox from "./components/MetadataBox.svelte";
  import MiniMap from "./components/MiniMap.svelte";
	import TimeseriesPlot from "./components/TimeseriesPlot.svelte";
	import DailyBarplot from "./components/DailyBarplot.svelte";
	import DiurnalPlot from "./components/DiurnalPlot.svelte";

	// Initialize the leaflet map from URL parameters
	// ?centerlat=42.2936&centerlon=-118.8281&zoom=4
	const urlParams = new URLSearchParams(window.location.search);
  if ( urlParams.has('centerLon') ) {
	  $centerLon = urlParams.get('centerLon');
	}
  if ( urlParams.has('centerLat') ) {
	  $centerLat = urlParams.get('centerLat');
	}
  if ( urlParams.has('zoom') ) {
	  $zoom = urlParams.get('zoom');
	}

</script>

<main>

	<h1>Monitoring v5 ({$VERSION})</h1>

	<AlertBox>
		<b>This working prototype is  for evaluation purposes only.</b>
	</AlertBox>

	{#await all_monitors.load()}
		<p>Loading monitoring data...</p>
	{:then}

		<p>
			Showing {$all_monitors.count()} monitoring locations.
			&nbsp;&nbsp;
			Hover over a location to generate plots.
		</p>

		<div>
			<LeafletMap width="1200px" height="400px"/>
		</div>

		{#if $selected_id !== "" }
			<div class="plot-row">
				<TimeseriesPlot element_id="r0_timeseries" width="1200px"/>
			</div>
		{/if}

		{#if $selected_id !== "" }
			<div class="plot-row">
				<MetadataBox element_id="r1_metadata" width="300px" height="200px"/>
				<MiniMap element_id="r1_minimap" width="200px" height="200px"/>
				<TimeseriesPlot element_id="r1_timeseries" width="200px" height="200px" size="small"/>
				<DailyBarplot element_id="r1_daily" width="200px" height="200px"  size="small"/>
				<DiurnalPlot element_id="r1_diurnal" width="200px" height="200px"  size="small"/>
			</div>
		{/if}

	{:catch}
		<p style="color: red">An error occurred</p>
	{/await}

</main>

<style>

  h1 {
    color: coral;
  }
  .plot-row {
    display: flex;
  }
</style>
