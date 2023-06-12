<script>
	// Exports
	export let element_id = 'default-remove-row-button';
  export let id = '';

  // Imports
  import {
    selected_ids,
    map_update_needed,
  } from '../stores/gui-store.js';

  function removeRow(id) {
    let ids = $selected_ids;
    let index = ids.indexOf(id)
    let removedItem = ids.splice(index, 1);
    $selected_ids = ids;
    map_update_needed.set(true);
  }
</script>

<button id="{element_id}" class="remove-row"
        on:click={removeRow(id)}>
  X
</button>

<style>
	button.remove-row {
    color: #8a6d3b;
    background-color: #e3f1fc;
    border: 1px solid #bbb;
    border-radius: 4px;
    margin: 50px 0px;
    padding: 10px;
    vertical-align: bottom;
	}
</style>