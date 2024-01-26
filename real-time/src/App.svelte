<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';
	import { pas, patCart } from './stores/purpleair-data-store.js';

  import {
		VERSION,
		error_message,
		monitorCount,
		purpleairCount,
		centerLon,
    centerLat,
    zoom,
		hovered_monitor_id,
		selected_monitor_ids,
		selected_purpleair_ids,
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

  // Utility functions
  import { getPurpleAirData } from './js/utils-purpleair.js';
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
	  $selected_monitor_ids = urlParams.get('monitors').split(',');
	}

	async function loadPurpleAirData(ids) {
		for (let i = 0; i < ids.length; i++) {
			let id = ids[i];
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
		}
	}

  if ( urlParams.has('purpleair') ) {
    pas.load().then(function(synopticData) {
			let purpleair_ids = urlParams.get('purpleair').split(',');
		  loadPurpleAirData(purpleair_ids);
		});
	}

	function unselectHovered() {
		$hovered_monitor_id = "";
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
			Showing {$monitorCount} monitors and {$purpleairCount} PurpleAirs.
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
			<span class="selected-devices-count">{$selected_monitor_ids.length} monitors</span>
			<div id="service-links">
				<a target="_blank" rel="noreferrer" href="https://airfire-monitoring-guis.s3.us-west-2.amazonaws.com/ara/v5/real-time-temporary/index.html">Temporary Only</a>
				{#if $selected_monitor_ids.length > 0}
					<a target="_blank" rel="noreferrer" href="{createDataServiceUrl($selected_monitor_ids)}">CSV File</a>
				{/if}
			</div>
		</div>

		<hr>

		{#each $selected_monitor_ids as id, i}

			<div class="flex-row" on:mouseenter={unselectHovered}>
				<RemoveRowButton id={id}/>
				<MetadataBox element_id="row{i}_metadata" width="300px" height="200px" id={id}/>
				<div class="flex-row">
				{#if $current_slide === "all"}
					<div class="flex-row">
						<MiniMap element_id="row{i}_map" width="200px" height="180px" id={id}/>
						<TimeseriesPlot element_id="row{i}_small_timeseries" width="200px" height="200px" id={id}  size="small"/>
						<DailyBarplot element_id="row{i}_small_daily" width="200px" height="200px" id={id}  size="small"/>
						<DiurnalPlot element_id="row{i}_small_diurnal" width="200px" height="200px" id={id}  size="small"/>
					</div>
					{:else if $current_slide === "timeseries"}
						<TimeseriesPlot element_id="row{i}_timeseries" width="800px" height="200px" id={id}  size="large"/>
					{:else if $current_slide === "hourly"}
						<HourlyBarplot element_id="row{i}_hourly" width="800px" height="200px" id={id}  size="large"/>
					{:else if $current_slide === "daily"}
						<DailyBarplot element_id="row{i}_daily" width="800px" height="200px" id={id}  size="large"/>
					{:else if $current_slide === "diurnal"}
						<DiurnalPlot element_id="row{i}_diurnal" width="800px" height="200px" id={id}  size="large"/>
					{/if}
					<SlideAdvance element_id="row{i}_slideAdvance"/>
				</div>
			</div>

		{/each}

		<hr>

		<div class="flex-row">
			<span class="selected-devices">Selected PurpleAir Sensors:</span>
			<span class="selected-devices-count">{$selected_purpleair_ids.length} sensors</span>
		</div>

		<hr>

		{#each $selected_purpleair_ids as id, i}

			<div class="flex-row">
				<RemoveRowButton id={id} deviceType="purpleair"/>
				<MetadataBox element_id="purpleair_row{i}_metadata" width="300px" height="200px" id={id} deviceType="purpleair"/>
				<div class="flex-row">
					{#if $current_slide === "all"}
						<div class="flex-row">
							<MiniMap element_id="purpleair_row{i}_map" width="200px" height="180px" id={id} deviceType="purpleair"/>
							<TimeseriesPlot element_id="purpleair_row{i}_small_timeseries" width="200px" height="200px" id={id} size="small" deviceType="purpleair"/>
							<DailyBarplot element_id="purpleair_row{i}_small_daily" width="200px" height="200px" id={id} size="small" deviceType="purpleair"/>
							<DiurnalPlot element_id="purpleair_row{i}_small_diurnal" width="200px" height="200px" id={id} size="small" deviceType="purpleair"/>
						</div>
						{:else if $current_slide === "timeseries"}
							<TimeseriesPlot element_id="purpleair_row{i}_timeseries" width="800px" height="200px" id={id} size="large" deviceType="purpleair"/>
						{:else if $current_slide === "hourly"}
							<HourlyBarplot element_id="purpleair_row{i}_hourly" width="800px" height="200px" id={id} size="large" deviceType="purpleair"/>
						{:else if $current_slide === "daily"}
							<DailyBarplot element_id="purpleair_row{i}_daily" width="800px" height="200px" id={id} size="large" deviceType="purpleair"/>
						{:else if $current_slide === "diurnal"}
							<DiurnalPlot element_id="purpleair_row{i}_diurnal" width="800px" height="200px" id={id} size="large" deviceType="purpleair"/>
						{/if}
						<SlideAdvance element_id="purpleair_row{i}_SlideAdvance"/>
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
