<script>
// Exports
export let id = '';

// Svelte stores
import { airsis } from '../stores/monitor-data-store.js';
import { wrcc } from '../stores/monitor-data-store.js';

// Utility functions
import { createQCServiceUrl } from '../js/utils.js';

// NOTE:  airsis.meta and wrcc.meta an arquero tables
let airsis_ids =
  $airsis.meta.array('deviceDeploymentID')
  // This is where I can filter for Susan's JBLM research monitors -- only show non-matches
  .filter(id => id.indexOf("_pnwusfs") === -1 );

let wrcc_ids = $wrcc.meta.array('deviceDeploymentID');

// sort by deviceID
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#sorting_array_of_objects
airsis_ids.sort((a, b) => {
  const nameA = $airsis.getMetadata(a, 'deviceID'); // ignore upper and lowercase
  const nameB = $airsis.getMetadata(b, 'deviceID'); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  // names must be equal
  return 0;
});

wrcc_ids.sort((a, b) => {
  const nameA = $wrcc.getMetadata(a, 'deviceID'); // ignore upper and lowercase
  const nameB = $wrcc.getMetadata(b, 'deviceID'); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  // names must be equal
  return 0;
});

// Make this statement reactive
$: location_report_url = 'https://tools.airfire.org/location/report?monitorid=' + id;
</script>

<div class="flex-row">

  <table class="monitor-table">
    <thead>
      <tr>
        <th colspan="5" class="provider-title">
          AIRSIS
        </th>
      </tr>
      <tr>
        <th></th>
        <th>Unit ID</th>
        <th>State</th>
        <th>AIRSIS Name</th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each airsis_ids as id, i}
      <tr>
        <td>
          <a target="_blank" href="{createQCServiceUrl('airsis', $airsis.getMetadata(id, 'deviceID'))}">QC</a>
        </td>
        <td>{$airsis.getMetadata(id, 'deviceID')}</td>
        <td>{$airsis.getMetadata(id, 'stateCode')}</td>
        <td>{$airsis.getMetadata(id, 'locationName')}</td>
        <td></td>
        <td></td>
      </tr>
      {/each}
    </tbody>
  </table>

  <table class="monitor-table">
    <thead>
      <tr>
        <th colspan="5" class="provider-title">
          WRCC
        </th>
      </tr>
      <tr>
        <th></th>
        <th>Unit ID</th>
        <th>State</th>
        <th>WRCC Name</th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each wrcc_ids as id, i}
      <tr>
        <td>
          <a target="_blank" href="{createQCServiceUrl('wrcc', $wrcc.getMetadata(id, 'deviceID'))}">QC</a>
        </td>
        <td>{$wrcc.getMetadata(id, 'deviceID').replace('wrcc.', '')}</td>
        <td>{$wrcc.getMetadata(id, 'stateCode')}</td>
        <td>{$wrcc.getMetadata(id, 'locationName')}</td>
        <td></td>
        <td></td>
      </tr>
      {/each}
    </tbody>
  </table>

</div>

<style>
.flex-row {
  display: flex;
}

.monitor-table {
  border: 2px solid #ccc;
  margin: 0px 20px;
}

th.provider-title {
  text-align: center;
  font-size: larger;
}

th {
  text-align: left;
  padding: 2px 5px;
}

td {
  text-align: left;
  padding: 2px 5px;
}

</style>

