<script>
  import { onMount } from "svelte";
  import { DateTime } from "luxon";

  // --- Svelte stores ---
  import {
    VERSION,
    error_message,
    loadedStatusText,
    waitingStatusText,
    centerLon,
    centerLat,
    zoom,
    selected_monitor_ids,
		selected_datetime,
    is_playing,
    play_speed_ms,
    current_slide,
  } from "./stores/gui-store.js";

  import {
    airnow,
    airnow_selected,
    airnow_geojson,
  } from "./stores/monitor-data-store.js";

  // --- Components ---
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";

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
    parseWindowQueryParams,
  } from "./js/utils.js";

  // --- Parse URL params once on startup ---
  const urlParams = parseWindowQueryParams();

  // --- Apply initial map center/zoom ---
  if (urlParams.centerlat !== undefined) $centerLat = urlParams.centerlat;
  if (urlParams.centerlon !== undefined) $centerLon = urlParams.centerlon;
  if (urlParams.zoom !== undefined) $zoom = urlParams.zoom;

  // --- Apply initial monitor selections (after data loads) ---
  $: if (urlParams.monitors && $airnow) {
    $selected_monitor_ids = urlParams.monitors;
  }

  // --- Initial load + refresh ---
  onMount(() => {
    // Initial load
    airnow_geojson.load?.();

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

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newUrl);
  }

  // Reactively update URL whenever relevant state changes
  $: updateUrl();

  // Playback controls
  let playbackTimer;

  $: {
    // Clean up previous timer
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }

    // Set a new timer only if playing
    if ($is_playing) {
      playbackTimer = setInterval(() => {
        const dt = DateTime.fromISO($selected_datetime);

        if (!dt.isValid) return;

        // Increment by 1 hour
        const next = dt.plus({ hours: 1 });

        // Set new value (remains in local time)
        selected_datetime.set(
          next.toISO({ suppressSeconds: true, suppressMilliseconds: true, includeOffset: false })
        );
      }, $play_speed_ms);
    }
  }

</script>

<main>

	<NavBar>
		<img class="logo" src="images/forestservicelogo-inverted.svg"
		     alt="US Forest Service logo">
		<span class="mv5">Monitoring v{$VERSION} &mdash; Annual</span>
		<input
      type="datetime-local"
      bind:value={$selected_datetime}
      step="3600"
    />

    <button id="play_pause" on:click={() => is_playing.update(x => !x)}>
      { $is_playing ? "Pause" : "Play" }
    </button>
	</NavBar>

	<div class="airfire-alerts" style="display: none"></div>

	{#if $error_message !== "" }
		<AlertBox level="error">
			<b>{$error_message}</b>
		</AlertBox>
	{/if}

  {#await airnow.load()}
		<p>Loading data...</p>
	{:then}

		<!-- Current status -->
		{#if $loadedStatusText}
			<p class="status">
				{$loadedStatusText}
			</p>
		{/if}

		{#if $waitingStatusText}
			<p class="status" style="font-style: italic">
				{$waitingStatusText}
			</p>
		{/if}

		<!-- Leaflet Map ---------------------------------------------------------->
		{#if $airnow_geojson}
		<div >
			<LeafletMap width="1200px" height="600px"/>
		</div>
		{/if}

    		<hr>

		<!-- Selected Monitors ---------------------------------------------------->
		<!-- <div class="flex-row">
			<span class="selected-devices">Selected Monitors:</span>
			<span class="selected-devices-count">{$selected_monitor_ids.length} monitors</span>
			<div id="service-links">
				<a target="_blank" rel="noreferrer" href="https://airfire-monitoring-guis.s3.us-west-2.amazonaws.com/ara/v5/real-time-temporary/index.html">Temporary Only</a>
				{#if $selected_monitor_ids.length > 0}
				<a target="_blank" rel="noreferrer" href="{createDataServiceUrl($selected_monitor_ids)}">CSV File</a>
				<a target="_blank" rel="noreferrer" href="{createAQINowCastServiceUrl($selected_monitor_ids)}">AQI-NowCast</a>
				{/if}
			</div>
		</div> -->

		<hr>

		{#if $airnow_selected}
			{#each $selected_monitor_ids as id, i}

				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="flex-row">
					<RemoveRowButton id={id}/>
					<MetadataBox element_id="row{i}_metadata" width="300px" height="200px" id={id}/>
					<div class="flex-row">
						{#if $current_slide === "all"}
							<div class="flex-row">
								<MiniMap element_id="row{i}_map" width="200px" height="180px" id={id}/>
								<TimeseriesPlot element_id="row{i}_small_timeseries" width="200px" height="200px" id={id} size="small"/>
								<DailyBarplot element_id="row{i}_small_daily" width="200px" height="200px" id={id} size="small"/>
								<DiurnalPlot element_id="row{i}_small_diurnal" width="200px" height="200px" id={id} size="small"/>
							</div>
						{:else if $current_slide === "timeseries"}
							<TimeseriesPlot element_id="row{i}_timeseries" width="800px" height="200px" id={id} size="large"/>
						{:else if $current_slide === "hourly"}
							<HourlyBarplot element_id="row{i}_hourly" width="800px" height="200px" id={id} size="large"/>
						{:else if $current_slide === "daily"}
							<DailyBarplot element_id="row{i}_daily" width="800px" height="200px" id={id} size="large"/>
						{:else if $current_slide === "diurnal"}
							<DiurnalPlot element_id="row{i}_diurnal" width="800px" height="200px" id={id} size="large"/>
						{/if}
						<SlideAdvance element_id="row{i}_slideAdvance"/>
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
  }

	input[type="datetime-local"] {
    font-family: "Source Sans Pro", "Helvetica", sans-serif;
    font-size: 16px;             /* slightly smaller than .mv5 (24px) */
    padding: 2px 4px;
    margin-left: auto;           /* pushes input to the right */
    margin-right: 20px;          /* right margin */
  }

	input[type="datetime-local"]:hover {
		border-color: #aaa;
	}

	p.status {
		text-align: left;
		margin: 10px 0 0 10px;
		font-size: 0.8rem;
	}

  button#play_pause {
    padding: 0.3em 1.2em;
    width: 5em;
    /*
    border-radius: 8px;
    border: 1px solid transparent;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #1a1a1a;
    cursor: pointer;
    transition: border-color 0.25s;
    */
  }

  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;  /* or center, if you prefer */
    gap: 0.5rem;              /* space between button and box */
    margin: 0.25rem 0;
  }
</style>
