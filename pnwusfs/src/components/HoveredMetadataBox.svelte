<script>
// Exports
export let element_id = 'default-hovered-metadata-box';
export let width = '300px';
export let height = '220px'; // height + padding-top should equal HourlyBarplot height

// Svelte stores
// monitor-data-store
import {
  all_monitors,
  airsis_geojson,
} from '../stores/monitor-data-store.js';
// gui-store
import {
  hovered_id,
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

  let features = $airsis_geojson.features

  let currentStatus;
  features.forEach(o => {
    if ( o.properties.deviceDeploymentID === id ) currentStatus = o.properties;
  });

  // TODO: Handle currentStatus === undefined

  return(currentStatus);

}

</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">
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

