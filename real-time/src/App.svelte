<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';

	import {
     patCart,
  } from './stores/sensor-data-store.js';

  import {
		VERSION,
		error_message,
		centerLon,
    centerLat,
    zoom,
		hovered_id,
		selected_ids,
		selected_sensor_ids,
		current_slide,
	} from './stores/gui-store.js';

  // Svelte Components
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import HoveredMetadataBox from "./components/HoveredMetadataBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
  import MetadataBox from "./components/MetadataBox.svelte";
  import MiniMap from "./components/MiniMap.svelte";
	import TimeseriesPlot from "./components/TimeseriesPlot.svelte";
	import HoveredHourlyBarplot from "./components/HoveredHourlyBarplot.svelte";
	import HourlyBarplot from "./components/HourlyBarplot.svelte";
	import DailyBarplot from "./components/DailyBarplot.svelte";
	import DiurnalPlot from "./components/DiurnalPlot.svelte";
	import RemoveRowButton from "./components/RemoveRowButton.svelte";
	import SlideAdvance from "./components/SlideAdvance.svelte";
  import { createDataServiceUrl } from './js/utils.js';

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
		<span class="mv5">Monitoring v{$VERSION}</span>
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
			<HoveredHourlyBarplot element_id="hovered_hourly" width="800px" height="200px"/>
		</div>

		<hr>

		<div class="flex-row">
			<span class="selected-devices">Selected Monitors:</span>
			<span class="selected-devices-count">{$selected_ids.length} monitors</span>
			<div id="service-links">
				<a target="_blank" rel="noreferrer" href="https://airfire-monitoring-guis.s3.us-west-2.amazonaws.com/ara/v5/real-time-temporary/index.html">Temporary Only</a>
				{#if $selected_ids.length > 0}
					<a target="_blank" rel="noreferrer" href="{createDataServiceUrl($selected_ids)}">CSV File</a>
				{/if}
			</div>
		</div>

		<hr>

		{#each $selected_ids as id, i}

			<div class="flex-row" on:mouseenter={unselectHovered}>
				<RemoveRowButton id={id}/>
				<MetadataBox element_id="r{i}_metadata" width="300px" height="200px" id={id}/>
				<div class="flex-row">
				{#if $current_slide === "all"}
					<div class="flex-row">
						<MiniMap element_id="r{i}_map" width="200px" height="180px" id={id}/>
						<TimeseriesPlot element_id="r{i}_small_timeseries" width="200px" height="200px" id={id}  size="small"/>
						<DailyBarplot element_id="r{i}_small_daily" width="200px" height="200px" id={id}  size="small"/>
						<DiurnalPlot element_id="r{i}_small_diurnal" width="200px" height="200px" id={id}  size="small"/>
					</div>
					{:else if $current_slide === "timeseries"}
						<TimeseriesPlot element_id="r{i}_timeseries" width="800px" height="200px" id={id}  size="large"/>
					{:else if $current_slide === "hourly"}
						<HourlyBarplot element_id="r{i}_hourly" width="800px" height="200px" id={id}  size="large"/>
					{:else if $current_slide === "daily"}
						<DailyBarplot element_id="r{i}_daily" width="800px" height="200px" id={id}  size="large"/>
					{:else if $current_slide === "diurnal"}
						<DiurnalPlot element_id="r{i}_diurnal" width="800px" height="200px" id={id}  size="large"/>
					{/if}
					<SlideAdvance element_id="r{i}_slideAdvance"/>
				</div>
			</div>

		{/each}

		<hr>

		<div class="flex-row">
			<span class="selected-devices">Selected Sensors:</span>
			<span class="selected-devices-count">{$selected_sensor_ids.length} sensors</span>
		</div>

		<hr>

		{#each $selected_sensor_ids as id, i}

			<div class="flex-row">
				<RemoveRowButton id={id}/>
				<MetadataBox element_id="sensor_r{i}_metadata" width="300px" height="200px" id={id} deviceType="sensor"/>
				<div class="flex-row">
					{#if $current_slide === "all"}
						<div class="flex-row">
							<MiniMap element_id="sensor_r{i}_map" width="200px" height="180px" id={id} deviceType="sensor"/>
							<!-- <TimeseriesPlot element_id="sensor_r{i}_small_timeseries" width="200px" height="200px" id={id} size="small" deviceType="sensor"/>
							<DailyBarplot element_id="sensor_r{i}_small_daily" width="200px" height="200px" id={id} size="small" deviceType="sensor"/>
							<DiurnalPlot element_id="sensor_r{i}_small_diurnal" width="200px" height="200px" id={id} size="small" deviceType="sensor"/> -->
						</div>
						<!-- {:else if $current_slide === "timeseries"}
							<TimeseriesPlot element_id="sensor_r{i}_timeseries" width="800px" height="200px" id={id} size="large" deviceType="sensor"/> -->
						{:else if $current_slide === "hourly"}
							<HourlyBarplot element_id="sensor_r{i}_hourly" width="800px" height="200px" id={id} size="large" deviceType="sensor"/>
						<!-- {:else if $current_slide === "daily"}
							<DailyBarplot element_id="sensor_r{i}_daily" width="800px" height="200px" id={id} size="large" deviceType="sensor"/>
						{:else if $current_slide === "diurnal"}
							<DiurnalPlot element_id="sensor_r{i}_diurnal" width="800px" height="200px" id={id} size="large" deviceType="sensor"/> -->
						{/if}
						<SlideAdvance element_id="r{i}_sensorSlideAdvance"/>
					</div>
				</div>

		{/each}

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

	div#service-links {
		text-align: center;
		padding-left: 400px
	}

	#service-links a {
		padding: 0px 10px;
	}

	span.selected-devices {
		font-size: 1.0rem;
		font-weight: bold;
		padding-left: 65px;
		padding-right: 20px;
	}

	span.selected-devices-count {
		font-style: italic;
	}

  .flex-row {
    display: flex;
  }

</style>
