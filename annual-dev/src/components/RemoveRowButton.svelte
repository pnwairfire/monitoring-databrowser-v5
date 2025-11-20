<script>
	// Exports
	export let element_id = 'default-remove-row-button';
  export let id = '';
  export let deviceType = 'monitor';

  // Imports
  import {
    selected_monitor_ids,
    unselected_monitor_id,
  } from '../stores/gui-store.js';

  function removeRow(id) {
    if ( deviceType === 'monitor') {
      let ids = $selected_monitor_ids;
      let index = ids.indexOf(id)
      ids.splice(index, 1);
      $selected_monitor_ids = ids;
      $unselected_monitor_id = id;
    }

  }
</script>

<button id="{element_id}" class="remove-row"
        on:click={removeRow(id)}>
  X
</button>

<style>
	button.remove-row {
    height: 6em;
    color: #8a6d3b;
    background-color: #e3f1fc;
    border: 1px solid #bbb;
    border-radius: 4px;
    margin: 50px 0px;
    padding: 10px;
    vertical-align: bottom;
	}
</style>