<script>
	// Exports
	export let element_id = 'default-daily-barplot';
  export let width = '400px';
  export let height = '300px';
  export let id = '';
  export let size = 'big';
  export let deviceType = 'monitor';

  // Svelte methods
  import { onDestroy, onMount } from 'svelte';

  // Stores
  import { all_monitors } from '../stores/monitor-data-store.js';
  import { pas, patCart } from '../stores/purpleair-data-store.js';
  import { clarity } from '../stores/clarity-data-store.js';
  import { mapLastUpdated } from "../stores/gui-store.js";

  // Highcharts for plotting
  import Highcharts from 'highcharts';

  // Plot configuration
  import {
    dailyBarplotConfig,
    small_dailyBarplotConfig,
    pm25_addAQIStackedBar,
  } from "air-monitor-plots";

  // Special functions
  import { dailyStats } from 'air-monitor-algorithms';

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
        const monitor = $all_monitors;

        // Special method to get an object containing daily averages
        const daily = monitor.getDailyStats(id);

        // Assemble required plot data
        plotData = {
          daily_datetime: daily.datetime,
          daily_mean: daily.mean,
          daily_nowcast: undefined, // not required
          locationName: monitor.getMetadata(id, 'locationName'),
          timezone: monitor.getMetadata(id, 'timezone'),
          title: undefined // use default title
        }

      } else if ( deviceType === "purpleair" ) {

        // Get a copy of the reactive data
        const index = $patCart.items.findIndex((item) => item.id === id);
        let purpleairData = $patCart.items[index].data;
        // epa_pm25,epa_nowcast,local_ts
        // 9.1,9.9,2023-07-05 12:00:00-0700
        let datetime = purpleairData.map((o) => o.datetime);
        let pm25 = purpleairData.map((o) => o.epa_pm25);

        let site = $pas.filter(o => o.sensor_index == id)[0];
        let timezone = site.timezone;

        // Special method to get an object containing daily averages
        const daily = dailyStats(datetime, pm25, timezone);

        plotData = {
          daily_datetime: daily.datetime,
          daily_mean: daily.mean,
          daily_nowcast: undefined, // not required
          locationName: "PurpleAir " + id,
          timezone: site.timezone,
          title: undefined // use default title
        };

      } else if ( deviceType === "clarity" ) {

        // Special method to get an object containing daily averages
        const daily = $clarity.getDailyStats(id);

        // Assemble required plot data
        plotData = {
          daily_datetime: daily.datetime,
          daily_mean: daily.mean,
          daily_nowcast: undefined, // not required
          locationName: $clarity.getMetadata(id, 'locationName'),
          timezone: $clarity.getMetadata(id, 'timezone'),
          title: undefined // use default title
        }

      }

      // ----- Create the chartConfig ------------------------------------------

      if ( size === 'small' ) {
        plotData.title = "Daily Average PM2.5";
        chartConfig = small_dailyBarplotConfig(plotData);
        // Disable hover
        chartConfig.plotOptions.column.enableMouseTracking = false;
        chart = Highcharts.chart(context, chartConfig);
        pm25_addAQIStackedBar(chart, 4);
      } else {
        chartConfig = dailyBarplotConfig(plotData);
        // Remove title
        chartConfig.title = { text: '' };
        // Add zoom
        chartConfig.chart.zoomBySingleTouch = true;
        chartConfig.chart.zoomType = "x";
        chart = Highcharts.chart(context, chartConfig);
        pm25_addAQIStackedBar(chart, 6);
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

  }

  // Build chart on first mount (for slide changes)
  onMount(createChart);

  // Rebuild chart whenever id changes
  $: if (id) {
    createChart();
  }
  // Rebuild chart whenever data updates
  $: if ($mapLastUpdated) {
    createChart();
  }
</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" class="chart-container"
      style="width: {width}; height: {height};">
</div>

<style>

</style>
