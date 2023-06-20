<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';
  import {
		VERSION,
		error_message,
		centerLon,
    centerLat,
    zoom,
		hovered_id,
		selected_ids,
		current_slide,
	} from './stores/gui-store.js';
  // Svelte Components
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import HoveredMetadataBox from "./components/HoveredMetadataBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
  import MetadataBox from "./components/MetadataBox.svelte";
  import MetadataTable from "./components/MetadataTable.svelte";
  import MiniMap from "./components/MiniMap.svelte";
	import TimeseriesPlot from "./components/TimeseriesPlot.svelte";
	import HourlyBarplot from "./components/HourlyBarplot.svelte";
	import DailyBarplot from "./components/DailyBarplot.svelte";
	import DiurnalPlot from "./components/DiurnalPlot.svelte";
	import RemoveRowButton from "./components/RemoveRowButton.svelte";
	import SlideAdvance from "./components/SlideAdvance.svelte";
  //import { createDataServiceUrl } from './js/utils.js';

	// Initialize the leaflet map from URL parameters
	const urlParams = new URLSearchParams(window.location.search);
  if ( urlParams.has('centerlat') ) {
	  $centerLat = urlParams.get('centerlat');
	}
  if ( urlParams.has('centerlon') ) {
	  $centerLon = urlParams.get('centerlon');
	}
  if ( urlParams.has('zoom') ) {
	  $zoom = urlParams.get('zoom');
	}
  if ( urlParams.has('monitors') ) {
	  $selected_ids = urlParams.get('monitors').split(',');
	}

	function unselectHovered() {
		$hovered_id = "";
	}

</script>

<main>

	<NavBar>
		<img class="logo" src="images/forestservicelogo-inverted.svg"
		     alt="US Forest Service logo">
		<span class="mv5">Temporary Monitors v{$VERSION}</span>
	</NavBar>


	{#if $error_message === "" }
		<AlertBox level="warning">
			<b>This working prototype is for evaluation purposes only.</b>
		</AlertBox>
	{:else}
		<AlertBox level="error">
			<b>{$error_message}</b>
		</AlertBox>
	{/if}

	{#await all_monitors.load()}
		<p>Loading monitoring data...</p>
	{:then}

	<p class="status">
		Showing {$all_monitors.count()} temporary monitors on {new Date().toLocaleDateString('en-US')}.
	</p>

	<div >
		<LeafletMap width="1200px" height="400px"/>
	</div>

	<hr>

  <MetadataTable width="100%"/>

	{:catch}
		<p style="color: red">An error occurred</p>
	{/await}

</main>

<style>
  img.logo {
		vertical-align: middle;
		height: 35px;
		width: 35px;
	}

  span.mv5 {
    color: white;
		font-size: 24px;
		font-family: "Source Sans Pro", "Helvetica", sans-serif;
		padding-left: 10px;
		vertical-align: text-top;
  }

	p.status {
		text-align: left;
		margin: 10px 0 0 10px;
		/* font-size: 0.8rem; */
	}

  .flex-row {
    display: flex;
  }

</style>
