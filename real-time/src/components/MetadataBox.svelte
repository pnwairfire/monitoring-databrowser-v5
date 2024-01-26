<script>
// Exports
export let element_id = 'default-metadata-box';
export let width = '400px';
export let height = '300px';
export let id = '';
export let deviceType = 'monitor';

// Svelte stores
import { all_monitors } from '../stores/monitor-data-store.js';
import { pas } from '../stores/purpleair-data-store.js';

// Make these statements reactive
// $: location_report_url = 'https://tools.airfire.org/location/report?monitorid=' + id;
$: airnow_qc_report_url = 'https://tools.airfire.org/monitor-airnow-qc-report/v1/airnow?aqsid=' + $all_monitors.getMetadata(id, 'AQSID');

function create_temp_qc_report_url(id) {
  let url;
  const deviceID = $all_monitors.getMetadata(id, 'deviceID');
  const aggregator = $all_monitors.getMetadata(id, 'dataIngestSource').toLowerCase();
  const baseUrl = "https://tools.airfire.org/monitor-qc-report/v2/";
  const provider = deviceID.split(".")[0];
  const unit_id = deviceID.split(".")[1];
  if (aggregator === "airsis") {
    url = baseUrl + "airsis?provider=" + provider + "&unitID=" + unit_id;
  } else if (aggregator === "wrcc") {
    url = baseUrl + "wrcc?unitID=" + unit_id;
  } else {
    throw new Error("unrecognized aggregator: " + aggregator);
  }
  return url;
}

function create_location_report_url(id) {
  let baseUrl = 'https://tools.airfire.org/location/';
  let url;
  if ( deviceType === "monitor" ) {
    url = baseUrl + "report?monitorid=" + id;
  } else if ( deviceType === "purpleair" ) {
    let currentStatus = sensorIdToCurrentStatus(id);
    url = baseUrl + "report?longitude=" + currentStatus.longitude + "&latitude=" + currentStatus.latitude;
  } else {
    url = baseUrl;
  }
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
  return(currentStatus);

}
</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">

  {#if deviceType === "monitor"}

    <span class="bold">{$all_monitors.getMetadata(id, 'locationName')}</span><br>
    {#if $all_monitors.getMetadata(id, 'countryCode') === 'US' }
      <span class="bold">{$all_monitors.getMetadata(id, 'countyName')} county, </span>
    {/if}
    <span class="bold">{$all_monitors.getMetadata(id, 'stateCode')}</span><br>
    <a class="location-report" target="_blank" rel=noreferrer href="{create_location_report_url(id)}">Location Report</a><br>
    Elevation:&nbsp;&nbsp;{Math.round($all_monitors.getMetadata(id, 'elevation'))} m<br>
    ID:&nbsp;&nbsp;{id}<br>
    AQSID:&nbsp;&nbsp;{$all_monitors.getMetadata(id, 'AQSID')}<br>
    Source:&nbsp;&nbsp;{$all_monitors.getMetadata(id, 'dataIngestSource')}
    {#if $all_monitors.getMetadata(id, 'dataIngestSource') === 'AirNow' }
      <a class="qc-report" target="_blank" rel=noreferrer href="{airnow_qc_report_url}">QC</a>
    {:else}
      <a class="qc-report" target="_blank" rel=noreferrer href="{create_temp_qc_report_url(id)}">QC</a>
    {/if}
    <br>
    Deployment type:&nbsp;&nbsp;{$all_monitors.getMetadata(id, 'deploymentType')}<br>
    <!-- Contains data through {$all_monitors.getMetadata(id, 'last_validTime')}<br> TODO:  Need to keep a list/dict of monitor properties found in .geojson -->
    Timezone:&nbsp;&nbsp;{$all_monitors.getMetadata(id, 'timezone')}<br>

  {:else if deviceType === "purpleair"}

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

  {/if}

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

  a.location-report{
    font-weight: bold
  }

  a.qc-report{
    font-weight: bold
  }
</style>

