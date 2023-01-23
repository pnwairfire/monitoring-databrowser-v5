<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';
  import { selected_id } from './stores/gui-store.js';
  // Svelte Components
  // import SelectRandomButton from "./components/SelectRandomButton.svelte";
  // import PlotTypeButton from "./components/PlotTypeButton.svelte";
	import TimeseriesPlot from "./components/TimeseriesPlot.svelte";
	import DailyBarplot from "./components/DailyBarplot.svelte";
	import DiurnalPlot from "./components/DiurnalPlot.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
</script>

<main>

	<h1>Monitoring v5 Development Interface</h1>

	{#await all_monitors.load()}
		<p>Loading monitoring data...</p>
	{:then}

		<p>
			Showing {$all_monitors.count()} monitoring locations.
			&nbsp;&nbsp;
			Hover over a location to generate plots.
		</p>

		<div>
			<LeafletMap width="1200px" height="400px"/>
		</div>

		{#if selected_id !== "" }
			<div class="plot-row">
				<TimeseriesPlot element_id="r1_timeseries" width="400px"/>
				<DailyBarplot element_id="r1_daily" width="400px"/>
				<DiurnalPlot element_id="r1_diurnal" width="400px"/>
			</div>
		{/if}

	{:catch}
		<p style="color: red">An error occurred</p>
	{/await}

</main>

<style>
  h1 {
    color: coral;
  }
  .plot-row {
    display: flex;
  }
</style>
