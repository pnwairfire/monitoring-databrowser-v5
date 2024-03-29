<script>
  // Exports
  export let element_id = 'default-hovered-hourly-barplot';
  export let width = '400px';
  export let height = '300px';
  export let id = '';
  export let size = 'big';

  // Svelte methods
  import { afterUpdate } from 'svelte';

  // Svelte stores
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

  // Highcharts for plotting
  import Highcharts from 'highcharts';

  // Plot configuration
  import {
    hourlyBarplotConfig,
    small_hourlyBarplotConfig,
    pm25_addAQIStackedBar,
  } from "air-monitor-plots";

  // Asynchronous sensor data access
  import { getPurpleAirData } from '../js/utils-purpleair.js';

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

    // NOTE:  When moving quickly, sensor data cannot be downloaded quickly
    // NOTE:  enough and generates errors here.
    try {
      if (myChart) myChart.destroy();
    } catch(err) {
      // Do nothing
    }

    // Get a copy of the reactive data and id
    const monitor = $all_monitors;

    // For r0_hourly, show the hovered_monitor_id
    if ( element_id === "hovered_hourly" ) {
      id = $hovered_monitor_id;
      if ( $use_hovered_purpleair ) {
        id = $hovered_purpleair_id;
      }
      if ( $use_hovered_clarity ) {
        id = $hovered_clarity_id;
      }
    }

    if ( id !== "" ) {

      // Assemble required plot data
      let plotData;

      if ( $use_hovered_purpleair ) {

        // NOTE:  When moving quickly, sensor data cannot be downloaded quickly
        // NOTE:  enough and generates errors here.
        try {
          // NOTE:  Data isn't loaded until a sensor is selected. So we load it
          // NOTE:  every time for the hovered plot.
          let purpleairData = await getPurpleAirData(id);

          // epa_pm25,epa_nowcast,local_ts
          // 9.1,9.9,2023-07-05 12:00:00-0700

          let site = $pas.filter(o => o.sensor_index == id)[0];
          let timezone = site.timezone;
          plotData = {
            datetime: purpleairData.map((o) => new Date(o.local_ts)),
            pm25: purpleairData.map((o) => o.epa_pm25),
            nowcast: purpleairData.map((o) => o.epa_nowcast),
            locationName: "PurpleAir " + id,
            timezone: timezone,
            title: undefined // use default title
          };
        } catch(err) {
          // Do nothing
        }

      } else if ( $use_hovered_clarity ) {

        plotData = {
          datetime: $clarity.getDatetime(),
          pm25: $clarity.getPM25(id),
          nowcast: $clarity.getNowcast(id),
          locationName: $clarity.getMetadata(id, 'locationName'),
          timezone: $clarity.getMetadata(id, 'timezone'),
          title: undefined // use default title
        };

      } else {

        plotData = {
          datetime: monitor.getDatetime(),
          pm25: monitor.getPM25(id),
          nowcast: monitor.getNowcast(id),
          locationName: monitor.getMetadata(id, 'locationName'),
          timezone: monitor.getMetadata(id, 'timezone'),
          title: undefined // use default title
        };

      }


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
