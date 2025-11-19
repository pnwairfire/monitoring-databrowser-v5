<script>
  // --- Component Inputs ---
  export let element_id = 'default-hovered-hourly-barplot';
  export let width = '400px';
  export let height = '300px';
  export let id = '';          // Optional ID passed in from parent
  export let size = 'big';     // Either 'big' or 'small'

  // --- Svelte Lifecycle and Luxon ---
  import { afterUpdate } from 'svelte';

  // --- Svelte Stores ---
  import { all_monitors } from '../stores/monitor-data-store.js';
  import { pas } from '../stores/purpleair-data-store.js';
  import { clarity } from '../stores/clarity-data-store.js';
  import {
    hovered_monitor_id,
    hovered_purpleair_id,
    use_hovered_purpleair,
    hovered_clarity_id,
    use_hovered_clarity,
  } from '../stores/gui-store.js';

  // --- Highcharts ---
  import Highcharts from 'highcharts';

  // --- Plot Config Helpers ---
  import {
    hourlyBarplotConfig,
    small_hourlyBarplotConfig,
    pm25_addAQIStackedBar,
  } from "air-monitor-plots";

  // --- Utility to Fetch PurpleAir Data ---
  import { getPurpleAirData } from '../js/utils-purpleair.js';

  // --- Local Chart Variables ---
  let chartConfig;
  let myChart;
  let chartElement;

  // Helper: Safely destroy an existing chart
  function destroyChart() {
    if (myChart?.destroy) {
      myChart.destroy();
      myChart = null;
    }
  }

  // Helper: Resolve the correct ID based on hover state
  function resolveHoveredId() {
    if (element_id === "hovered_hourly") {
      if ($use_hovered_clarity) return $hovered_clarity_id;
      if ($use_hovered_purpleair) return $hovered_purpleair_id;
      return $hovered_monitor_id;
    }
    return id;
  }

  // Main function: Create and render the chart
  async function createChart() {

    destroyChart(); // Clean up existing chart

    let resolved_id = resolveHoveredId();
    if (!resolved_id || !chartElement) return;

    // Assemble required plot data
    let plotData;

    if ($use_hovered_purpleair) {

      // PurpleAir data must be fetched on demand
      try {
        const purpleairData = await getPurpleAirData(resolved_id);
        const site = $pas.find(o => o.sensor_index == resolved_id);
        if (!site || !purpleairData?.length) return;

        plotData = {
          datetime: purpleairData.map((o) => o.datetime),
          pm25: purpleairData.map((o) => o.epa_pm25),
          nowcast: purpleairData.map((o) => o.epa_nowcast),
          locationName: "PurpleAir " + resolved_id,
          timezone: site.timezone,
          title: undefined,
        };

      } catch (err) {
        console.warn("Failed to fetch PurpleAir data", err);
        return;
      }

    } else if ($use_hovered_clarity) {

      // Clarity data is already loaded via the store
      plotData = {
        datetime: $clarity.getDatetime(),
        pm25: $clarity.getPM25(resolved_id),
        nowcast: $clarity.getNowcast(resolved_id),
        locationName: $clarity.getMetadata(resolved_id, 'locationName'),
        timezone: $clarity.getMetadata(resolved_id, 'timezone'),
        title: undefined,
      };

    } else {

      // Default: monitored sensor data from all_monitors
      plotData = {
        datetime: $all_monitors.getDatetime(),
        pm25: $all_monitors.getPM25(resolved_id),
        nowcast: $all_monitors.getNowcast(resolved_id),
        locationName: $all_monitors.getMetadata(resolved_id, 'locationName'),
        timezone: $all_monitors.getMetadata(resolved_id, 'timezone'),
        title: undefined,
      };

    }

    // Configure the chart
    if (plotData && plotData.datetime?.length) {
      if (size === 'small') {
        plotData.title = "Hourly NowCast";
        chartConfig = small_hourlyBarplotConfig(plotData);
        chartConfig.plotOptions.column.enableMouseTracking = false;
        myChart = Highcharts.chart(chartElement, chartConfig);
        pm25_addAQIStackedBar(myChart, 4);
      } else {
        chartConfig = hourlyBarplotConfig(plotData);
        chartConfig.title = { text: '' }; // Remove main title
        chartConfig.yAxis.title.text = "NowCast (µg/m³)";
        chartConfig.chart.zoomBySingleTouch = true;
        chartConfig.chart.zoomType = "x";
        myChart = Highcharts.chart(chartElement, chartConfig);
        pm25_addAQIStackedBar(myChart, 6);
      }
    } else {
      // Fallback chart when no data is available
      chartConfig = {
        title: { text: "No data available" },
        xAxis: { min: 0, max: 50 },
        yAxis: { min: 0, max: 1 },
        series: [{ data: [] }],
      };
      myChart = Highcharts.chart(chartElement, chartConfig);
    }

  }

  // Regenerate the chart after any update to values imported "from '../stores/gui-store.js';"
  afterUpdate(createChart);

</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div
  id="{element_id}"
  class="chart-container"
  bind:this={chartElement}
  style="width: {width}; height: {height};"
></div>

<style>
  .chart-container {
    padding-top: 5px;
  }
</style>
