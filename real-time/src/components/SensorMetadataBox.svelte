<script>
// Exports
export let element_id = 'default-sensor-metadata-box';
export let width = '400px';
export let height = '300px';
export let id = '';

// sensor-data-store
import {
  pas,
} from '../stores/sensor-data-store.js';

function create_location_report_url(id) {
  let baseUrl = 'https://tools.airfire.org/location/report?';
  const currentStatus = sensorIdToCurrentStatus(id);
  let url = baseUrl + "longitude=" + currentStatus.longitude + "&latitude=" + currentStatus.latitude;
  return url;
}

function sensorIdToCurrentStatus(id) {
  // 'pas' synopticData
  //
  // epa_nowcast: 7.7
  // epa_pm25: 7.2
  // latitude: 45.031963
  // longitude: -110.71382
  // raw_pm25: 4.4
  // sensor_index: 154193
  // timezone: "America/Denver"
  // utc_ts: "2023-07-11 21:00:00+0000"

  // filter() returns an array so we take the first element
  let currentStatus = $pas.filter(o => o.sensor_index == id)[0];
  const latency = (new Date() - new Date(currentStatus.utc_ts)) / (1000 * 3600);
  currentStatus['last_latency'] = Math.round(latency * 10) / 10;
  return(currentStatus);
}

</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">
  <span class="bold">PurpleAir {id}</span><br>

  <!-- Location Report currently fails with: Error in UseMethod("as_s2_geography")
  <a class="location-report" target="_blank" rel=noreferrer href="{create_location_report_url(id)}">Location Report</a><br>
  -->
  <br>
  Elevation:&nbsp;&nbsp;NA<br>
  ID:&nbsp;&nbsp;{id}<br>
  AQSID:&nbsp;&nbsp;none<br>
  Source:&nbsp;&nbsp;PurpleAir
  <br>
  Deployment type:&nbsp;&nbsp;Low Cost Sensor<br>
  <!-- Contains data through {$all_monitors.getMetadata(id, 'last_validTime')}<br> TODO:  Need to keep a list/dict of monitor properties found in .geojson -->
  Timezone:&nbsp;&nbsp;{sensorIdToCurrentStatus(id)['timezone']}<br>

</div>

<style>
  div {
    padding-top: 25px;
    padding-left: 30px;
    text-align: left;
    font-size: 0.8rem;
    line-height: 1.1rem;
  }

  span.bold {
    font-weight: bold;
    font-size: 1.0rem;
  }
</style>

