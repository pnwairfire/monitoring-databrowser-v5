<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';
  import {
		VERSION,
		centerLon,
    centerLat,
    zoom,
		hovered_id,
		selected_ids,
		r1_slide,
	} from './stores/gui-store.js';
  // Svelte Components
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import HoveredMetadataBox from "./components/HoveredMetadataBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
  import MetadataBox from "./components/MetadataBox.svelte";
  import MiniMap from "./components/MiniMap.svelte";
	import TimeseriesPlot from "./components/TimeseriesPlot.svelte";
	import HourlyBarplot from "./components/HourlyBarplot.svelte";
	import DailyBarplot from "./components/DailyBarplot.svelte";
	import DiurnalPlot from "./components/DiurnalPlot.svelte";
	import SlideAdvance from "./components/SlideAdvance.svelte";

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

	function leaveMap() {
		$hovered_id = "";
	}

</script>

<main>

	<NavBar>
		<img class="logo" src="images/forestservicelogo-inverted.svg"
		     alt="US Forest Service logo">
		<span class="mv5">Monitoring v{$VERSION}</span>
	</NavBar>

	<AlertBox>
		<b>This working prototype is for evaluation purposes only.</b>
	</AlertBox>

	{#await all_monitors.load()}
		<p>Loading monitoring data...</p>
	{:then}

		<p class="status">
			Showing {$all_monitors.count()} monitoring locations.
		</p>

		<div id="hovered-row" class="flex-row">
			{#if $hovered_id !== "" }
				<HoveredMetadataBox element_id="hovered-metadata-box" width="300px" height="220px"/>
				<HourlyBarplot element_id="hovered_hourly" width="880px" height="200px"/>
		{/if}
	  </div>

		<div on:mouseleave={leaveMap}>
			<LeafletMap width="1200px" height="400px"/>
		</div>

		<hr>

		{#if $selected_ids[0] !== [""] }
		<div class="flex-row">
			<MetadataBox element_id="r1_metadata" width="300px" height="200px"/>
			<div class="flex-row">
			{#if $r1_slide === "all"}
				<div class="flex-row">
					<MiniMap width="200px" height="180px"/>
					<!-- <TimeseriesPlot element_id="r1_timeseries" width="200px" height="200px" size="small"/> -->
					<HourlyBarplot element_id="r1_hourly" width="200px" height="200px" size="small"/>
					<DailyBarplot element_id="r1_daily" width="200px" height="200px"  size="small"/>
					<DiurnalPlot element_id="r1_diurnal" width="200px" height="200px"  size="small"/>
				</div>
				{:else if $r1_slide === "timeseries"}
					<TimeseriesPlot element_id="r1_full" width="800px" height="200px"  size="large"/>
				{:else if $r1_slide === "hourly"}
					<HourlyBarplot element_id="r1_full" width="800px" height="200px"  size="large"/>
				{:else if $r1_slide === "daily"}
					<DailyBarplot element_id="r1_full" width="800px" height="200px"  size="large"/>
				{:else if $r1_slide === "diurnal"}
					<DiurnalPlot element_id="r1_full" width="800px" height="200px"  size="large"/>
				{/if}
				<SlideAdvance element_id="r1_slideAdvance"/>
			</div>
		</div>
	{/if}

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

	div#hovered-row {
		height: 260px;
	}

  .flex-row {
    display: flex;
  }
</style>
