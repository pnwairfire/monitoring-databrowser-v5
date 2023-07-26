<script>
  // Svelte stores
  import { all_monitors } from './stores/monitor-data-store.js';
  import {
		VERSION,
		error_message,
		centerLon,
    centerLat,
    zoom,
	} from './stores/gui-store.js';
  // Svelte Components
  import NavBar from "./components/NavBar.svelte";
  import AlertBox from "./components/AlertBox.svelte";
  import LeafletMap from "./components/LeafletMap.svelte";
  import MetadataTable from "./components/MetadataTable.svelte";

</script>

<main>

	<NavBar>
		<img class="logo" src="images/forestservicelogo-inverted.svg"
		     alt="US Forest Service logo">
		<span class="mv5">Temporary Monitors v{$VERSION}</span>
	</NavBar>


	{#if $error_message === "" }
		<AlertBox level="warning">
			<b>This working prototype is for evaluation purposes only.</b>
		</AlertBox>
	{:else}
		<AlertBox level="error">
			<b>{$error_message}</b>
		</AlertBox>
	{/if}

	{#await all_monitors.load()}
		<p>Loading monitoring data...</p>
	{:then}

	<p class="status">
		Showing {$all_monitors.count()} temporary monitors on {new Date().toLocaleDateString('en-US')}.
	</p>

	<div >
		<LeafletMap width="1200px" height="400px"/>
	</div>

	<hr>

  <MetadataTable width="100%" element_id="metadata-table"/>

	{:catch}
		<p style="color: red">An error occurred</p>
	{/await}

</main>

<style>
  img.logo {
		vertical-align: middle;
		height: 35px;
		width: 35px;
	}

  span.mv5 {
    color: white;
		font-size: 24px;
		font-family: "Source Sans Pro", "Helvetica", sans-serif;
		padding-left: 10px;
		vertical-align: text-top;
  }

	p.status {
		text-align: left;
		margin: 10px 0 0 10px;
		/* font-size: 0.8rem; */
	}

  /* .flex-row {
    display: flex;
  } */
</style>
