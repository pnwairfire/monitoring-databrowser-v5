<script>
	// Exports
	export let element_id = 'default-timeseries-plot';
  export let width = '400px';
  export let height = '300px';
  export let id = '';
  export let size = 'big';
  export let deviceType = 'monitor';

  // Svelte methods
  import { afterUpdate } from 'svelte';

  // Stores
  import { all_monitors } from '../stores/monitor-data-store.js';
  import { pas, patCart } from '../stores/purpleair-data-store.js';
  import { clarity } from '../stores/clarity-data-store.js';

  // Highcharts for plotting
  import Highcharts from 'highcharts';

  // Plot Configuration
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
  let myChart;

  function createChart() {

    context = document.getElementById(element_id);

    // See https://www.youtube.com/watch?v=s7rk2b1ioVE @6:30
    if (myChart) myChart.destroy();

    if ( id !== "" ) {

      // ----- Assemble required plot data -------------------------------------

      let plotData;

      if ( deviceType === "monitor" ) {

        // Get a copy of the reactive data
        const monitor = $all_monitors;

        // Assemble required plot data
        plotData = {
          datetime: monitor.getDatetime(),
          pm25: monitor.getPM25(id),
          nowcast: monitor.getNowcast(id),
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

        let site = $pas.filter(o => o.sensor_index == id)[0];

        plotData = {
          datetime: purpleairData.map((o) => new Date(o.local_ts)),
          pm25: purpleairData.map((o) => o.epa_pm25),
          nowcast: purpleairData.map((o) => o.epa_nowcast),
          locationName: "PurpleAir " + id,
          timezone: site.timezone,
          title: undefined // use default title
        };

      } else if ( deviceType === "clarity" ) {

        // Assemble required plot data
        plotData = {
          datetime: $clarity.getDatetime(),
          pm25: $clarity.getPM25(id),
          nowcast: $clarity.getNowcast(id),
          locationName: $clarity.getMetadata(id, 'locationName'),
          timezone: $clarity.getMetadata(id, 'timezone'),
          title: undefined // use default title
        };

      }

      // ----- Create the chartConfig ------------------------------------------

      if ( size === 'small' ) {
        plotData.title = "PM2.5 & Nowcast";
        chartConfig = small_timeseriesPlotConfig(plotData);
        // Disable hover
        chartConfig.plotOptions.line.enableMouseTracking = false;
        chartConfig.plotOptions.scatter.enableMouseTracking = false;
        myChart = Highcharts.chart(context, chartConfig);
        pm25_addAQIStackedBar(myChart, 4);
      } else {
        chartConfig = timeseriesPlotConfig(plotData);

        // Remove title
        chartConfig.title = "";
        // Add zoom
        chartConfig.chart.zoomBySingleTouch = true;
        chartConfig.chart.zoomType = "x";
        myChart = Highcharts.chart(context, chartConfig);
        pm25_addAQIStackedBar(myChart, 6);
      }

    }

  }

  // Regenerate the chart after any update
  afterUpdate(createChart);
</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" class="chart-container"
     style="width: {width}; height: {height};">
</div>

<style>

</style>

