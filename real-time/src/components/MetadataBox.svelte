<script>
// Exports
export let element_id = 'default-metadata-box';
export let width = '400px';
export let height = '300px';

// Svelte stores
import { all_monitors } from '../stores/monitor-data-store.js';
import { selected_ids } from '../stores/gui-store.js';

// Make this statement reactive
$: location_report_url = 'https://tools.airfire.org/location/report?monitorid=' + $selected_ids[0];
</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">
  <span class="bold">{$all_monitors.getMetadata($selected_ids[0], 'locationName')}</span><br>
  {#if $all_monitors.getMetadata($selected_ids[0], 'countryCode') === 'US' }
    <span class="bold">{$all_monitors.getMetadata($selected_ids[0], 'countyName')} county, </span>
  {/if}
  <span class="bold">{$all_monitors.getMetadata($selected_ids[0], 'stateCode')}</span><br>
  <a class="location-report" target="_blank" rel=noreferrer href="{location_report_url}">Location Report</a><br>
  Elevation:&nbsp;&nbsp;{Math.round($all_monitors.getMetadata($selected_ids[0], 'elevation'))} m<br>
  ID:&nbsp;&nbsp;{$selected_ids[0]}<br>
  AQSID:&nbsp;&nbsp;{$all_monitors.getMetadata($selected_ids[0], 'AQSID')}<br>
  Source:&nbsp;&nbsp;{$all_monitors.getMetadata($selected_ids[0], 'dataIngestSource')}<br>
  Deployment type:&nbsp;&nbsp;{$all_monitors.getMetadata($selected_ids[0], 'deploymentType')}<br>
  <!-- Contains data through {$all_monitors.getMetadata($selected_ids[0], 'last_validTime')}<br> TODO:  Need to keep a list/dict of monitor properties found in .geojson -->
  Timezone:&nbsp;&nbsp;{$all_monitors.getMetadata($selected_ids[0], 'timezone')}<br>
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
</style>

