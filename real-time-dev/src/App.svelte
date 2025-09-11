<script>
  import { onMount } from "svelte";
  import { DateTime } from "luxon";

  // --- Svelte stores ---
  import {
    VERSION,
    error_message,
    monitorCount,
    purpleairCount,
    clarityCount,
    hmsFiresCount,
    centerLon,
    centerLat,
    zoom,
		exclusion_ids,
    hovered_monitor_id,
    selected_monitor_ids,
    selected_purpleair_ids,
    selected_clarity_ids,
    current_slide,
    mapLastUpdated,
  } from "./stores/gui-store.js";

  import {
    all_monitors,
    airnow_geojson,
    airsis_geojson,
    wrcc_geojson,
  } from "./stores/monitor-data-store.js";

  import { pas, patCart } from "./stores/purpleair-data-store.js";
  import { clarity, clarity_geojson } from "./stores/clarity-data-store.js";
  import { hms_fires_csv, hms_smoke_geojson } from "./stores/hms-data-store.js";

  // --- Components ---
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
  import HoveredMetadataBox from "./components/HoveredMetadataBox.svelte";
  import HoveredHourlyBarplot from "./components/HoveredHourlyBarplot.svelte";
  import RemoveRowButton from "./components/RemoveRowButton.svelte";
  import SlideAdvance from "./components/SlideAdvance.svelte";
  import MetadataBox from "./components/MetadataBox.svelte";
  import MiniMap from "./components/MiniMap.svelte";
  import TimeseriesPlot from "./components/TimeseriesPlot.svelte";
  import HourlyBarplot from "./components/HourlyBarplot.svelte";
  import DailyBarplot from "./components/DailyBarplot.svelte";
  import DiurnalPlot from "./components/DiurnalPlot.svelte";

  // --- Utilities ---
  import {
    createAQINowCastServiceUrl,
    createDataServiceUrl,
    parseWindowQueryParams,
  } from "./js/utils.js";

	// Loaders
  import { getPurpleAirData } from "./js/utils-purpleair.js";
  import { loadExclusionList } from "./js/utils-loaders.js";

  const EXCLUSION_IDS_URL =
    "https://raw.githubusercontent.com/pnwairfire/monitoring-v5-CONFIG/refs/heads/main/exclusion_ids.json";

  // --- Parse URL params once on startup ---
  const urlParams = parseWindowQueryParams();

  // --- Apply initial map center/zoom ---
  if (urlParams.centerlat !== undefined) $centerLat = urlParams.centerlat;
  if (urlParams.centerlon !== undefined) $centerLon = urlParams.centerlon;
  if (urlParams.zoom !== undefined) $zoom = urlParams.zoom;

  // --- Apply initial monitor/clarity selections (after data loads) ---
  $: if (urlParams.monitors && $all_monitors) {
    $selected_monitor_ids = urlParams.monitors;
  }
  $: if (urlParams.clarity && $clarity && $clarity_geojson) {
    $selected_clarity_ids = urlParams.clarity;
  }

  // --- PurpleAir handling ---
  async function loadPurpleAirData(idList) {
    for (const id of idList) {
      // Skip if already loaded
      if ($patCart.items.some((item) => item.id === id)) {
        console.log(`PurpleAir id ${id} already loaded`);
        continue;
      }

      try {
        console.log(`Downloading PurpleAir data for id = ${id}`);
        const purpleairData = await getPurpleAirData(id);
        patCart.addItem({ id, data: purpleairData });
      } catch (err) {
        console.error(`Failed to load PurpleAir id ${id}:`, err);
      }
    }
    console.log("patCart.count =", $patCart.count);
  }

  // Apply PurpleAir selections once stores are ready
  $: if (urlParams.purpleair && $pas) {
    const idList = urlParams.purpleair;
    if (idList.length > 0) {
      loadPurpleAirData(idList);
      $selected_purpleair_ids = idList;
    }
  }

  // --- Initial load + refresh ---
  onMount(() => {
    // Initial load
    airnow_geojson.load?.();
    airsis_geojson.load?.();
    wrcc_geojson.load?.();
    clarity.load?.();
    clarity_geojson.load?.();
    pas.load?.();
    hms_fires_csv.load?.();
    hms_smoke_geojson.load?.();

		// Fetch exclusion IDs (async work)
   loadExclusionList(EXCLUSION_IDS_URL);

    // Periodic refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      airnow_geojson.reload();
      airsis_geojson.reload();
      wrcc_geojson.reload();
      pas.reload();
      clarity_geojson.reload();
      hms_smoke_geojson.reload();
      hms_fires_csv.reload();
      mapLastUpdated.set(DateTime.now());
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  });

  // --- Keep URL in sync with app state ---
  function updateUrl() {
    const params = new URLSearchParams();

    if ($centerLat != null) params.set("centerlat", $centerLat.toFixed(4));
    if ($centerLon != null) params.set("centerlon", $centerLon.toFixed(4));
    if ($zoom != null) params.set("zoom", $zoom);

    if ($selected_monitor_ids?.length) {
      params.set("monitors", $selected_monitor_ids.join(","));
    }
    if ($selected_purpleair_ids?.length) {
      params.set("purpleair", $selected_purpleair_ids.join(","));
    }
    if ($selected_clarity_ids?.length) {
      params.set("clarity", $selected_clarity_ids.join(","));
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newUrl);
  }

  // Reactively update URL whenever relevant state changes
  $: updateUrl();

  // --- Helpers ---
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

	<div class="airfire-alerts" style="display: none"></div>

	{#if $error_message !== "" }
		<AlertBox level="error">
			<b>{$error_message}</b>
		</AlertBox>
	{/if}

  {#await all_monitors.load()}
		<p>Loading monitor data...</p>
	{:then}

		<!-- Current status -->
		{#if $monitorCount + $purpleairCount + $clarityCount + $hmsFiresCount > 0}
			<p class="status">
				Showing
				{#if $monitorCount > 0}
					{$monitorCount} monitors
					{#if $purpleairCount > 0 || $clarityCount > 0 || $hmsFiresCount > 0}, {/if}
				{/if}
				{#if $purpleairCount > 0}
					{$purpleairCount} PurpleAir sensors
					{#if $clarityCount > 0 || $hmsFiresCount > 0}, {/if}
				{/if}
				{#if $clarityCount > 0}
					{$clarityCount} Clarity sensors
					{#if $hmsFiresCount > 0}, {/if}
				{/if}
				{#if $hmsFiresCount > 0}
					{$hmsFiresCount} HMS fire detections
				{/if}.
			</p>
		{/if}

		{#if $monitorCount === 0 || $purpleairCount === 0 || $clarityCount === 0 || $hmsFiresCount === 0}
			<p class="status" style="font-style: italic">
				Waiting for
				{#if $monitorCount === 0}monitor data{/if}
				{#if $purpleairCount === 0}
					{#if $monitorCount === 0}, {/if}PurpleAir data
				{/if}
				{#if $clarityCount === 0}
					{#if $monitorCount === 0 || $purpleairCount === 0}, {/if}Clarity data
				{/if}
				{#if $hmsFiresCount === 0}
					{#if $monitorCount === 0 || $purpleairCount === 0 || $clarityCount === 0}, {/if}HMS fire data
				{/if}...
			</p>
		{/if}

		<!-- Leaflet Map ---------------------------------------------------------->
		{#if $airnow_geojson && $airsis_geojson && $wrcc_geojson && $clarity_geojson && $pas}
		<div >
			<LeafletMap width="1200px" height="400px"/>
		</div>
		{/if}

		<div id="hovered-row" class="flex-row">
			<HoveredMetadataBox element_id="hovered-metadata-box" width="350px" height="160px"/>
			<HoveredHourlyBarplot element_id="hovered_hourly" width="800px" height="200px"/>
		</div>

		<hr>

		<!-- Selected Monitors ---------------------------------------------------->
		<div class="flex-row">
			<span class="selected-devices">Selected Monitors:</span>
			<span class="selected-devices-count">{$selected_monitor_ids.length} monitors</span>
			<div id="service-links">
				<a target="_blank" rel="noreferrer" href="https://airfire-monitoring-guis.s3.us-west-2.amazonaws.com/ara/v5/real-time-temporary/index.html">Temporary Only</a>
				{#if $selected_monitor_ids.length > 0}
				<a target="_blank" rel="noreferrer" href="{createDataServiceUrl($selected_monitor_ids)}">CSV File</a>
				<a target="_blank" rel="noreferrer" href="{createAQINowCastServiceUrl($selected_monitor_ids)}">AQI-NowCast</a>
				{/if}
			</div>
		</div>

		<hr>

		{#if $all_monitors}
			{#each $selected_monitor_ids as id, i}

				<!-- svelte-ignore a11y-no-static-element-interactions -->
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
		{/if}

		<hr>

		<!-- Selected PurpleAir Sensors ------------------------------------------->
		<div class="flex-row">
			<span class="selected-devices">Selected PurpleAir Sensors:</span>
			<span class="selected-devices-count">{$selected_purpleair_ids.length} sensors</span>
		</div>

		<hr>

		{#if $pas}
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
		{/if}

		<hr>

		<!-- Selected Clarity Sensors --------------------------------------------->
		<div class="flex-row">
			<span class="selected-devices">Selected Clarity Sensors:</span>
			<span class="selected-devices-count">{$selected_clarity_ids.length} sensors</span>
		</div>

		<hr>

		{#if $clarity && $clarity_geojson}
			{#each $selected_clarity_ids as id, i}

				<div class="flex-row">
					<RemoveRowButton id={id} deviceType="clarity"/>
					<MetadataBox element_id="clarity_row{i}_metadata" width="300px" height="200px" id={id} deviceType="clarity"/>
					<div class="flex-row">
						{#if $current_slide === "all"}
							<div class="flex-row">
								<MiniMap element_id="clarity_row{i}_map" width="200px" height="180px" id={id} deviceType="clarity"/>
								<TimeseriesPlot element_id="clarity_row{i}_small_timeseries" width="200px" height="200px" id={id} size="small" deviceType="clarity"/>
								<DailyBarplot element_id="clarity_row{i}_small_daily" width="200px" height="200px" id={id} size="small" deviceType="clarity"/>
								<DiurnalPlot element_id="clarity_row{i}_small_diurnal" width="200px" height="200px" id={id} size="small" deviceType="clarity"/>
							</div>
							{:else if $current_slide === "timeseries"}
								<TimeseriesPlot element_id="clarity_row{i}_timeseries" width="800px" height="200px" id={id} size="large" deviceType="clarity"/>
							{:else if $current_slide === "hourly"}
								<HourlyBarplot element_id="clarity_row{i}_hourly" width="800px" height="200px" id={id} size="large" deviceType="clarity"/>
							{:else if $current_slide === "daily"}
								<DailyBarplot element_id="clarity_row{i}_daily" width="800px" height="200px" id={id} size="large" deviceType="clarity"/>
							{:else if $current_slide === "diurnal"}
								<DiurnalPlot element_id="clarity_row{i}_diurnal" width="800px" height="200px" id={id} size="large" deviceType="clarity"/>
							{/if}
							<SlideAdvance element_id="clarity_row{i}_SlideAdvance"/>
						</div>
					</div>

			{/each}
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
