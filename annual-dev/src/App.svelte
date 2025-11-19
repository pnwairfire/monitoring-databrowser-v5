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
		selected_date,
  } from "./stores/gui-store.js";

  import {
    airnow,
    airnow_geojson,
  } from "./stores/monitor-data-store.js";

  // --- Components ---
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";

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

</script>

<main>

	<NavBar>
		<img class="logo" src="images/forestservicelogo-inverted.svg"
		     alt="US Forest Service logo">
		<span class="mv5">Monitoring v{$VERSION} &mdash; Annual</span>
		<input type="date" bind:value={$selected_date} />
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

	input[type="date"] {
    font-family: "Source Sans Pro", "Helvetica", sans-serif;
    font-size: 16px;             /* slightly smaller than .mv5 (24px) */
    padding: 2px 4px;
    margin-left: auto;           /* pushes input to the right */
    margin-right: 20px;          /* right margin */
  }

	input[type="date"]:hover {
		border-color: #aaa;
	}

	p.status {
		text-align: left;
		margin: 10px 0 0 10px;
		font-size: 0.8rem;
	}
</style>
