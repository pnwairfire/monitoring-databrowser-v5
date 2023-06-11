<script>
// Exports
export let element_id = 'default-hovered-metadata-box';
export let width = '300px';
export let height = '220px'; // height + padding-top should equal HourlyBarplot height

// Svelte stores
import {
  all_monitors,
  airnow_geojson,
  airsis_geojson,
  wrcc_geojson,
} from '../stores/monitor-data-store.js';
import { hovered_id } from '../stores/gui-store.js';

// ----- Get current status -----

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

function idToCurrentStatus(id) {

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


// $: currentStatus = idToCurrentStatus(hovered_id);

</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">
  <!--
  <span class="bold">{$all_monitors.getMetadata($hovered_id, 'locationName')}</span><br>
  Latency:&nbsp;&nbsp;{idToCurrentStatus($hovered_id)['last_latency']}<br>
  Elevation:&nbsp;&nbsp;{Math.round($all_monitors.getMetadata($hovered_id, 'elevation'))} m<br>
  Source:&nbsp;&nbsp;{$all_monitors.getMetadata($hovered_id, 'dataIngestSource')}<br>
  -->
  <table>
    <thead>
      <th colspan="2">
        <span class="bold">{$all_monitors.getMetadata($hovered_id, 'locationName')}</span><br>
      </th>
      <tr>
        <td>Elevation</td>
        <td>{Math.round($all_monitors.getMetadata($hovered_id, 'elevation'))} m</td>
      </tr>
      <tr>
        <td width="40%">{$all_monitors.getMetadata($hovered_id, 'dataIngestSource')}</td>
        <td>{idToCurrentStatus($hovered_id)['dataIngestUnitID']}</td>
      </tr>
      <tr>
        <td>Latency</td>
        <td>{idToCurrentStatus($hovered_id)['last_latency']} hrs</td>
      </tr>
      <tr>
        <td>Last PM2.5</td>
        <td>{idToCurrentStatus($hovered_id)['last_PM2.5']} &#xb5;g/m&#xb3;</td>
      </tr>
      <tr>
        <td>Yesterday avg:</td>
        <td>{idToCurrentStatus($hovered_id)['yesterday_PM2.5_avg']} &#xb5;g/m&#xb3;</td>
      </tr>
    </thead>
  </table>
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

