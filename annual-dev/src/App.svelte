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
    selected_purpleair_ids,
    selected_clarity_ids,
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

  // --- Components ---
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";

  // --- Utilities ---
  import {
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

		// Fetch exclusion IDs (async work)
   loadExclusionList(EXCLUSION_IDS_URL);

    // Refresh data every 5 minutes
    const refreshInterval = setInterval(() => {
      airnow_geojson.reload();
      airsis_geojson.reload();
      wrcc_geojson.reload();
      pas.reload();
      clarity_geojson.reload();
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
		{#if $airnow_geojson && $airsis_geojson && $wrcc_geojson && $clarity_geojson && $pas}
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
