<script>
// Exports
export let element_id = 'default-hovered-metadata-box';
export let width = '300px';
export let height = '220px'; // height + padding-top should equal HourlyBarplot height

import { DateTime } from 'luxon';

// Svelte stores
// monitor-data-store
import {
  all_monitors,
  airnow_geojson,
  airsis_geojson,
  wrcc_geojson,
} from '../stores/monitor-data-store.js';
// purpleair-data-store
import {
  pas,
} from '../stores/purpleair-data-store.js';
import { clarity_geojson } from '../stores/clarity-data-store.js';
// gui-store
import {
  hovered_monitor_id,
  hovered_purpleair_id,
  hovered_clarity_id,
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

  if (dataIngestSource === "AirNow") {
    currentStatus.dataIngestUnitID = currentStatus.AQSID;
  }

  return(currentStatus);

}

function purpleairIdToCurrentStatus(id) {

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
  const latency = (DateTime.now().toUTC().diff(DateTime.fromISO(currentStatus.utc_ts)).as('hours'));
  currentStatus['last_latency'] = Math.round(latency * 10) / 10;
  return(currentStatus);

}

function clarityIdToCurrentStatus(id) {

  // "deviceDeploymentID":"9q5c59fnh9_clarity.DVVTD9746"
  // "AQSID":null
  // "fullAQSID":null
  // "deploymentType":null
  // "locationName":"DVVTD9746"
  // "timezone":"America/Los_Angeles"
  // "dataIngestSource":"Clarity"
  // "dataIngestUnitID":"DVVTD9746"
  // "currentStatus_processingTime":"2024-01-26 22:07:35"
  // "last_validTime":"2024-01-26 21:00:00",
  // "last_validLocalTimestamp":"2024-01-26 13:00:00 PST"
  // "last_nowcast":" 5.0"
  // "last_PM2.5":"  4.5"
  // "last_latency":"  1"
  // "yesterday_PM2.5_avg":" 3.5"

  let dataIngestSource = "Clarity";

  let features = $clarity_geojson.features;

  let currentStatus;
  features.forEach(o => {
    if ( o.properties.deviceDeploymentID === id ) currentStatus = o.properties;
  });

  return(currentStatus);

}


// $: currentStatus = monitorIdToCurrentStatus(hovered_monitor_id);
$: monitorStatus = $hovered_monitor_id ? monitorIdToCurrentStatus($hovered_monitor_id) : null;
$: purpleairStatus = $hovered_purpleair_id ? purpleairIdToCurrentStatus($hovered_purpleair_id) : null;
$: clarityStatus = $hovered_clarity_id ? clarityIdToCurrentStatus($hovered_clarity_id) : null;

</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" class="container" style="width: {width}; height: {height};">
  {#if monitorStatus }
    <table>
      <thead>
        <th colspan="2">
          <span class="bold">{$all_monitors.getMetadata($hovered_monitor_id, 'locationName')}</span><br>
        </th>
      </thead>
      <tbody>
        <tr>
          <td width="50%">Latency</td>
          <td>{monitorStatus['last_latency'] ?? 'NA'} hrs</td>
        </tr>
        <tr>
          <td>Latest Nowcast</td>
          <td>{monitorStatus['last_nowcast'] ?? 'NA'} &#xb5;g/m&#xb3;</td>
        </tr>
        <tr>
          <td>Yesterday 24hr Avg:</td>
          <td>{monitorStatus['yesterday_PM2.5_avg'] ?? 'NA'} &#xb5;g/m&#xb3;</td>
        </tr>
        <tr>
          <td>Elevation</td>
          <td>{Math.round($all_monitors.getMetadata($hovered_monitor_id, 'elevation'))} m</td>
        </tr>
        <tr>
          <td>{$all_monitors.getMetadata($hovered_monitor_id, 'dataIngestSource')} ID</td>
          <td>{monitorStatus['dataIngestUnitID'] ?? 'NA'}</td>
        </tr>
      </tbody>
    </table>
    {:else if purpleairStatus }
    <table>
      <thead>
        <th colspan="2">
          <span class="bold">PurpleAir {$hovered_purpleair_id}</span><br>
        </th>
      </thead>
      <tbody>
        <tr>
          <td width="50%">Latency</td>
          <td width="50%">{purpleairStatus['last_latency'] ?? 'NA'} hrs</td>
        </tr>
        <tr>
          <td>Latest Nowcast</td>
          <td>{purpleairStatus['epa_nowcast'] ?? 'NA'} &#xb5;g/m&#xb3;</td>
        </tr>
      </tbody>
    </table>
    {:else if clarityStatus }
    <table>
      <thead>
        <th colspan="2">
          <span class="bold">Clarity {clarityStatus['dataIngestUnitID'] ?? 'NA'}</span><br>
        </th>
      </thead>
      <tbody>
        <tr>
          <td width="50%">Latency</td>
          <td width="50%">{clarityStatus['last_latency'] ?? 'NA'} hrs</td>
        </tr>
        <tr>
          <td>Latest Nowcast</td>
          <td>{clarityStatus['last_nowcast'] ?? 'NA'} &#xb5;g/m&#xb3;</td>
        </tr>
        <tr>
          <td>Yesterday 24hr Avg:</td>
          <td>{clarityStatus['yesterday_PM2.5_avg'] ?? 'NA'} &#xb5;g/m&#xb3;</td>
        </tr>
      </tbody>
    </table>
  {:else}
    <table>
      <thead>
        <th colspan="2">
          <span class="bold">Mouse over a location...</span><br>
        </th>
      </thead>
      <tbody>
        <tr>
          <td width="50%">Latency</td>
          <td width="50%">NA</td>
        </tr>
        <tr>
          <td>Latest Nowcast</td>
          <td>NA</td>
        </tr>
        <tr>
          <td>Yesterday 24hr Avg:</td>
          <td>NA</td>
        </tr>
        <tr>
          <td>Elevation</td>
          <td>NA</td>
        </tr>
        <tr>
          <td>ID</td>
          <td>NA</td>
        </tr>
      </tbody>
    </table>
  {/if}
</div>

<style>
  div.container {
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

