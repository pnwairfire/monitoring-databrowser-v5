<script>
// Exports
export let element_id = 'default-hovered-metadata-box';
export let width = '300px';
export let height = '220px'; // height + padding-top should equal HourlyBarplot height

// Svelte stores
// monitor-data-store
import {
  all_monitors,
  airnow_geojson,
  airsis_geojson,
  wrcc_geojson,
} from '../stores/monitor-data-store.js';
// sensor-data-store
import {
  pas,
} from '../stores/sensor-data-store.js';
// gui-store
import {
  hovered_id,
  hovered_sensor_id,
} from '../stores/gui-store.js';

function monitorIdToCurrentStatus(id) {

//   "deviceDeploymentID": "6a9d812dd5f11126_usfs.1075",
//   "AQSID": null,
//   "fullAQSID": null,
//   "deploymentType": "Temporary",
//   "locationName": "USFS 1075 Tealee",
//   "timezone": "America/Denver",
//   "dataIngestSource": "AIRSIS",
//   "dataIngestUnitID": "1075",
//   "currentStatus_processingTime": "2023-05-22 22:04:44",
//   "last_validTime": "2023-05-22 19:00:00",
//   "last_validLocalTimestamp": "2023-05-22 13:00:00 MDT",
//   "last_nowcast": "4.1",
//   "last_PM2.5": "4.0",
//   "last_latency": "1",
//   "yesterday_PM2.5_avg": "1.9"

let dataIngestSource = $all_monitors.getMetadata(id, 'dataIngestSource');

  let features =
    dataIngestSource === "AirNow" ?
    $airnow_geojson.features :
    dataIngestSource === "AIRSIS" ?
    $airsis_geojson.features :
    dataIngestSource === "WRCC" ?
    $wrcc_geojson.features :
    console.log("dataIngestSource: " + dataIngestSource + " was not recognized.");

  let currentStatus;
  features.forEach(o => {
    if ( o.properties.deviceDeploymentID === id ) currentStatus = o.properties;
  });

  // TODO: Handle currentStatus === undefined

  if (dataIngestSource === "AirNow") {
    currentStatus.dataIngestUnitID = currentStatus.AQSID;
  }

  return(currentStatus);

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


// $: currentStatus = monitorIdToCurrentStatus(hovered_id);

</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">
  <!--
  <span class="bold">{$all_monitors.getMetadata($hovered_id, 'locationName')}</span><br>
  Latency:&nbsp;&nbsp;{monitorIdToCurrentStatus($hovered_id)['last_latency']}<br>
  Elevation:&nbsp;&nbsp;{Math.round($all_monitors.getMetadata($hovered_id, 'elevation'))} m<br>
  Source:&nbsp;&nbsp;{$all_monitors.getMetadata($hovered_id, 'dataIngestSource')}<br>
  -->
  {#if $hovered_id !== "" }
    <table>
      <thead>
        <th colspan="2">
          <span class="bold">{$all_monitors.getMetadata($hovered_id, 'locationName')}</span><br>
        </th>
      </thead>
      <tbody>
        <tr>
          <td width="50%">Elevation</td>
          <td>{Math.round($all_monitors.getMetadata($hovered_id, 'elevation'))} m</td>
        </tr>
        <tr>
          <td width="40%">{$all_monitors.getMetadata($hovered_id, 'dataIngestSource')} ID</td>
          <td>{monitorIdToCurrentStatus($hovered_id)['dataIngestUnitID']}</td>
        </tr>
        <tr>
          <td>Latency</td>
          <td>{monitorIdToCurrentStatus($hovered_id)['last_latency']} hrs</td>
        </tr>
        <tr>
          <td>Latest Nowcast</td>
          <td>{monitorIdToCurrentStatus($hovered_id)['last_nowcast']} &#xb5;g/m&#xb3;</td>
        </tr>
        <tr>
          <td>Yesterday 24hr Avg:</td>
          <td>{monitorIdToCurrentStatus($hovered_id)['yesterday_PM2.5_avg']} &#xb5;g/m&#xb3;</td>
        </tr>
      </tbody>
    </table>
  {:else if $hovered_sensor_id !== "" }
    <table>
      <thead>
        <th colspan="2">
          <span class="bold">PurpleAir {$hovered_sensor_id}</span><br>
        </th>
      </thead>
      <tbody>
        <tr>
          <td>Latency</td>
          <td>{sensorIdToCurrentStatus($hovered_sensor_id)['last_latency']} hrs</td>
        </tr>
        <tr>
          <td>Latest Nowcast</td>
          <td>{sensorIdToCurrentStatus($hovered_sensor_id)['epa_nowcast']} &#xb5;g/m&#xb3;</td>
        </tr>
        <tr>
          <td>Latest PM2.5</td>
          <td>{sensorIdToCurrentStatus($hovered_sensor_id)['epa_pm25']} &#xb5;g/m&#xb3;</td>
        </tr>
      </tbody>
    </table>

    {:else}
    <table>
      <thead>
        <th colspan="2">
          <span class="bold">Unmonitored Location</span><br>
        </th>
      </thead>
      <tbody>
        <tr>
          <td width="50%">Elevation</td>
          <td>NA</td>
        </tr>
        <tr>
          <td width="40%">{$all_monitors.getMetadata($hovered_id, 'dataIngestSource')} ID</td>
          <td>NA</td>
        </tr>
        <tr>
          <td>Latency</td>
          <td>NA</td>
        </tr>
        <tr>
          <td>Latest Nowcast</td>
          <td>NA</td>
        </tr>
        <tr>
          <td>Yesterday 24hr Avg:</td>
          <td>NA</td>
        </tr>
      </tbody>
    </table>
  {/if}
</div>

<style>
  div {
    padding-top: 40px;
    padding-left: 5px;
    text-align: left;
    font-size: 1.0rem;
    line-height: 1.1rem;
  }

  span.bold {
    font-weight: bold;
    font-size: 1.2rem;
  }

  table {
    width: 100%;
  }
</style>

