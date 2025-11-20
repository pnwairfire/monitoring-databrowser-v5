<script>
	// Exports
	export let element_id = 'default-timeseries-plot';
  export let width = '400px';
  export let height = '300px';
  export let id = '';
  export let size = 'big';
  export let deviceType = 'monitor';

  // Svelte methods
  import { onDestroy, onMount } from 'svelte';

  // Stores
  import { airnow_selected } from '../stores/monitor-data-store.js';
  import { mapLastUpdated } from "../stores/gui-store.js";

  // Highcharts for plotting
  import Highcharts from 'highcharts';

  // Plot configuration
  import {
    timeseriesPlotConfig,
    small_timeseriesPlotConfig,
    pm25_addAQIStackedBar
  } from "air-monitor-plots";

  // Good examples to learn from:
  //   https://www.youtube.com/watch?v=s7rk2b1ioVE
  //   https://svelte.dev/repl/d283589caa554badb16644ad40682802?version=3.38.2

  // We need these variables to live on after an individual chart is destroyed
  let chartConfig;
  let context;
  let chart;

  // Cleanup when component is destroyed
  onDestroy(() => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  });

  function createChart() {
    // Safety: destroy old chart before creating new
    if (chart) {
      chart.destroy();
      chart = null;
    }

    // Bail out if the container is not in the DOM yet
    context = document.getElementById(element_id);
    if (!context) return;

    // Don’t proceed if no ID is set
    if (id === "") {
      chartConfig = {
        title: { text: "" },
        yAxis: { min: 0, max: 1 },
        xAxis: { min: 1, max: 50 },
        series: [{ data: [null, null] }]
      };
      chart = Highcharts.chart(context, chartConfig);
      return;
    }

    // ----- Assemble required plot data -----
    let plotData;

    try {
      if (deviceType === "monitor") {
        const monitor = $airnow_selected;
        plotData = {
          datetime: monitor.getDatetime(),
          pm25: monitor.getPM25(id),
          nowcast: monitor.getNowcast(id),
          locationName: monitor.getMetadata(id, "locationName"),
          timezone: monitor.getMetadata(id, "timezone"),
          title: undefined
        };
      }
    } catch (err) {
      console.error("Failed to build plotData:", err);

      // Provide safe fallback
      plotData = {
        datetime: [],
        pm25: [],
        nowcast: [],
        locationName: "Unavailable",
        timezone: "UTC",
        title: "Data unavailable"
      };
    }

    // ----- Build chartConfig -----
    if (!plotData.datetime?.length) {
      // Fallback "no data" chart
      chartConfig = {
        title: { text: plotData.title || "No data available" },
        xAxis: { type: "datetime" },
        series: [{ data: [] }]
      };
      chart = Highcharts.chart(context, chartConfig);
      return;
    }

    if (size === "small") {
      plotData.title = "PM2.5 & Nowcast";
      chartConfig = small_timeseriesPlotConfig(plotData);

      // Disable hover
      chartConfig.plotOptions.line.enableMouseTracking = false;
      chartConfig.plotOptions.scatter.enableMouseTracking = false;

      chart = Highcharts.chart(context, chartConfig);
      pm25_addAQIStackedBar(chart, 4);

    } else {
      chartConfig = timeseriesPlotConfig(plotData);

      // Remove title + add zoom
      chartConfig.title = { text: "" };
      chartConfig.chart.zoomBySingleTouch = true;
      chartConfig.chart.zoomType = "x";

      chart = Highcharts.chart(context, chartConfig);
      pm25_addAQIStackedBar(chart, 6);
    }
  }

  // Build chart on first mount (for slide changes)
  onMount(createChart);

  // Rebuild chart whenever the selected monitor subset or ID changes
  // (this will fire when selected_datetime changes)
  $: if ($airnow_selected && id) {
    createChart();
  }

</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" class="chart-container"
     style="width: {width}; height: {height};">
</div>

<style>

</style>

