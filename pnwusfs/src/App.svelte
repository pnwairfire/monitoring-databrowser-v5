<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';
  import {
		VERSION,
		error_message,
		centerLon,
    centerLat,
    zoom,
	} from './stores/gui-store.js';
  // Svelte Components
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import HoveredMetadataBox from "./components/HoveredMetadataBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
	import HourlyBarplot from "./components/HourlyBarplot.svelte";

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

</script>

<main>

	<NavBar>
		<img class="logo" src="images/forestservicelogo-inverted.svg"
		     alt="US Forest Service logo">
		<span class="mv5">PNW USFS Monitors</span>
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
			Showing {$all_monitors.count()} monitoring locations.
		</p>

		<div >
			<LeafletMap width="1200px" height="400px"/>
		</div>

		<div id="hovered-row" class="flex-row">
			<HoveredMetadataBox element_id="hovered-metadata-box" width="350px" height="160px"/> <!-- 200px - padding-top-->
			<HourlyBarplot element_id="hovered_hourly" width="800px" height="200px"/>
		</div>

		<hr>

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
		font-size: 0.8rem;
	}

  .flex-row {
    display: flex;
  }

</style>
