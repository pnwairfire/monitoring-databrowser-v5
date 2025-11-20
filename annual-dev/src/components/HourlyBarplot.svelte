<script>
  // Exports
  export let element_id = 'default-hourly-barplot';
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
    hourlyBarplotConfig,
    small_hourlyBarplotConfig,
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

    if ( id !== "" ) {

      // ----- Assemble required plot data -------------------------------------

      let plotData;

      if ( deviceType === "monitor" ) {

        // Get a copy of the reactive data
        const monitor = $airnow_selected;

        plotData = {
          datetime: monitor.getDatetime(),
          pm25: monitor.getPM25(id),
          nowcast: monitor.getNowcast(id),
          locationName: monitor.getMetadata(id, 'locationName'),
          timezone: monitor.getMetadata(id, 'timezone'),
          title: undefined // use default title
        };

      }

      // ----- Create the chartConfig ------------------------------------------

      if ( size === 'small' ) {
        plotData.title = "Hourly NowCast";
        chartConfig = small_hourlyBarplotConfig(plotData);
        // Disable hover
        chartConfig.plotOptions.column.enableMouseTracking = false;
        chart = Highcharts.chart(context, chartConfig);
      } else {
        chartConfig = hourlyBarplotConfig(plotData);
        // Remove title
        chartConfig.title = { text: '' };
        // Shorten y-axis title
        chartConfig.yAxis.title.text = "NowCast (µg/m³)"
        // Add zoom
        chartConfig.chart.zoomBySingleTouch = true;
        chartConfig.chart.zoomType = "x";
        chart = Highcharts.chart(context, chartConfig);
      }

    } else {

      chartConfig = {
        title: {
          text: "",
        },
        yAxis: {
          min: 0,
          max: 1,
        },
        xAxis: {
          min: 1,
          max: 50
        },
        series: {
          data:[null,null]
        }
      };
      chart = Highcharts.chart(context, chartConfig);

    }

  } // END of createChart()

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
