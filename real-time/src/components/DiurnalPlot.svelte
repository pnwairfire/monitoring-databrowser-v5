<script>
	// Exports
	export let element_id = 'default-diurnal-plot';
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
    diurnalPlotConfig,
    small_diurnalPlotConfig,
    pm25_addAQIStackedBar,
  } from "air-monitor-plots";

  // Special functions
  import { diurnalStats } from 'air-monitor-algorithms';

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

        // Special method to get an object containing diurnal averages
        const diurnal = monitor.getDiurnalStats(id);

        // Assemble required plot data
        plotData = {
          datetime: monitor.getDatetime(),
          pm25: monitor.getPM25(id),
          nowcast: monitor.getNowcast(id),
          locationName: monitor.getMetadata(id, 'locationName'),
          timezone: monitor.getMetadata(id, 'timezone'),
          title: "",
          // unique to this chart
          hour_average: diurnal.mean,
          longitude: monitor.getMetadata(id, 'longitude'),
          latitude: monitor.getMetadata(id, 'latitude'),
        }

      } else if ( deviceType === "purpleair" ) {

        // Get a copy of the reactive data
        const index = $patCart.items.findIndex((item) => item.id === id);
        let purpleairData = $patCart.items[index].data;
        // epa_pm25,epa_nowcast,local_ts
        // 9.1,9.9,2023-07-05 12:00:00-0700
        let datetime = purpleairData.map((o) => new Date(o.local_ts));
        let pm25 = purpleairData.map((o) => o.epa_pm25);
        let nowcast = purpleairData.map((o) => o.epa_nowcast);

        let site = $pas.filter(o => o.sensor_index == id)[0];
        let timezone = site.timezone;

        // Special method to get an object containing daily averages
        const diurnal = diurnalStats(datetime, pm25, timezone);

        plotData = {
          datetime: datetime,
          pm25: pm25,
          nowcast: nowcast, // not required
          locationName: "PurpleAir " + id,
          timezone: site.timezone,
          title: "",
          // unique to this chart
          hour_average: diurnal.mean,
          longitude: site.longitude,
          latitude: site.latitude,
        };

      } else if ( deviceType === "clarity" ) {

        // Special method to get an object containing diurnal averages
        const diurnal = $clarity.getDiurnalStats(id);

        // Assemble required plot data
        plotData = {
          datetime: $clarity.getDatetime(),
          pm25: $clarity.getPM25(id),
          nowcast: $clarity.getNowcast(id),
          locationName: $clarity.getMetadata(id, 'locationName'),
          timezone: $clarity.getMetadata(id, 'timezone'),
          title: "",
          // unique to this chart
          hour_average: diurnal.mean,
          longitude: $clarity.getMetadata(id, 'longitude'),
          latitude: $clarity.getMetadata(id, 'latitude'),
        }

      }

      // ----- Create the chartConfig ------------------------------------------

      if ( size === 'small' ) {
        plotData.title = "Diurnal NowCast";
        chartConfig = small_diurnalPlotConfig(plotData);
        // Disable hover on 3 lines
        chartConfig.plotOptions.line.enableMouseTracking = false;
        myChart = Highcharts.chart(context, chartConfig);
        pm25_addAQIStackedBar(myChart, 4);
      } else {
        chartConfig = diurnalPlotConfig(plotData);
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
