<script>
  import { all_monitors } from '../stores/monitor-data-store.js';
  import { selected_id } from '../stores/gui-store.js';

	function selectRandom() {
		let ids = $all_monitors.getIDs();
		if (ids.length > 0) {
			let random_id = ids[Math.floor(Math.random() * ids.length)];
			$selected_id = random_id;
		}
	}
</script>

<button on:click={selectRandom}>
	Select Random
</button>

