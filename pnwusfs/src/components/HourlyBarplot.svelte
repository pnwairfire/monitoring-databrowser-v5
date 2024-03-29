<script>
  // Exports
  export let element_id = 'default-hourly-barplot';
  export let width = '400px';
  export let height = '300px';
  export let id = '';
  export let size = 'big';

  // Imports
  // Svelte methods
  import { afterUpdate } from 'svelte';
  // Svelte stores
  // monitor-data-store
  import { all_monitors } from '../stores/monitor-data-store.js';
  // gui-store
  import {
    selected_id,
  } from '../stores/gui-store.js';
  // Highcharts for plotting
  import Highcharts from 'highcharts';
  // import Exporting from "highcharts/modules/exporting";
  // Exporting(Highcharts);
  // Plot configuration
  import {
    hourlyBarplotConfig,
    small_hourlyBarplotConfig,
    pm25_addAQIStackedBar,
  } from "air-monitor-plots";

  // Good examples to learn from:
  //   https://www.youtube.com/watch?v=s7rk2b1ioVE
  //   https://svelte.dev/repl/d283589caa554badb16644ad40682802?version=3.38.2

  // We need these variables to live on after an individual chart is destroyed
  let chartConfig;
  let context;
  let myChart;

  async function createChart() {

    context = document.getElementById(element_id);

    // See https://www.youtube.com/watch?v=s7rk2b1ioVE @6:30
    if (myChart) myChart.destroy();

    // Get a copy of the reactive data and id
    const monitor = $all_monitors;

    // For r0_hourly, show the selected_id
    if ( element_id === "hovered_hourly" ) {
      id = $selected_id;
    }

    if ( id !== "" ) {

      // Assemble required plot data
      let plotData;

      plotData = {
        datetime: monitor.getDatetime(),
        pm25: monitor.getPM25(id),
        nowcast: monitor.getNowcast(id),
        locationName: monitor.getMetadata(id, 'locationName'),
        timezone: monitor.getMetadata(id, 'timezone'),
        title: undefined // use default title
      };

      // Create the chartConfig
      if ( size === 'small' ) {
        plotData.title = "Hourly NowCast";
        chartConfig = small_hourlyBarplotConfig(plotData);
        // Disable hover
        chartConfig.plotOptions.column.enableMouseTracking = false;
        myChart = Highcharts.chart(context, chartConfig);
        pm25_addAQIStackedBar(myChart, 4);
      } else {
        chartConfig = hourlyBarplotConfig(plotData);
        // Remove title
        chartConfig.title = "";
        // Shorten y-axis title
        chartConfig.yAxis.title.text = "NowCast (µg/m³)"
        // Add zoom
        chartConfig.chart.zoomBySingleTouch = true;
        chartConfig.chart.zoomType = "x";
        myChart = Highcharts.chart(context, chartConfig);
        pm25_addAQIStackedBar(myChart, 6);
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
      myChart = Highcharts.chart(context, chartConfig);

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
