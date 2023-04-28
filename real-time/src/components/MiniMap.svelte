<script>
// Exports
export let element_id = 'default-mini-map';
export let width = '400px';
export let height = '300px';

// Svelte stores
import { all_monitors } from '../stores/monitor-data-store.js';
import { selected_id } from '../stores/gui-store.js';
</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">
  Map goes here
</div>

<style>

</style>

