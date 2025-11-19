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
    hovered_monitor_id,
    selected_monitor_ids,
    mapLastUpdated,
  } from "./stores/gui-store.js";

  import {
    all_monitors,
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

	// Loaders
  import { loadExclusionList } from "./js/utils-loaders.js";

  const EXCLUSION_IDS_URL =
    "https://raw.githubusercontent.com/pnwairfire/monitoring-v5-CONFIG/refs/heads/main/exclusion_ids.json";

  // --- Parse URL params once on startup ---
  const urlParams = parseWindowQueryParams();

  // --- Apply initial map center/zoom ---
  if (urlParams.centerlat !== undefined) $centerLat = urlParams.centerlat;
  if (urlParams.centerlon !== undefined) $centerLon = urlParams.centerlon;
  if (urlParams.zoom !== undefined) $zoom = urlParams.zoom;

  // --- Apply initial monitor selections (after data loads) ---
  $: if (urlParams.monitors && $all_monitors) {
    $selected_monitor_ids = urlParams.monitors;
  }

  // --- Initial load + refresh ---
  onMount(() => {
    // Initial load
    airnow_geojson.load?.();

		// Fetch exclusion IDs (async work)
   loadExclusionList(EXCLUSION_IDS_URL);

    // Refresh data every 5 minutes
    const refreshInterval = setInterval(() => {
      airnow_geojson.reload();
			const now = DateTime.now();
			mapLastUpdated.set(now);
			console.log(`${now.toFormat("yyyy-LL-dd HH:mm:ss ZZZ")} Data refresh complete.`);
    }, 10 * 60 * 1000);

		// Cleanup when component is destroyed
		return () => {
			clearInterval(refreshInterval);
		};
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

  // --- Helpers ---
  function unselectHovered() {
    $hovered_monitor_id = "";
  }
</script>

<main>

	<NavBar>
		<img class="logo" src="images/forestservicelogo-inverted.svg"
		     alt="US Forest Service logo">
		<span class="mv5">Monitoring v{$VERSION} &mdash; Annual</span>
	</NavBar>

	<div class="airfire-alerts" style="display: none"></div>

	{#if $error_message !== "" }
		<AlertBox level="error">
			<b>{$error_message}</b>
		</AlertBox>
	{/if}

  {#await all_monitors.load()}
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
			<LeafletMap width="1200px" height="800px"/>
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
</style>
