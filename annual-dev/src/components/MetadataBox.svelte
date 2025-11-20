<script>
  // Exports
  export let element_id = 'default-metadata-box';
  export let width = '400px';
  export let height = '300px';
  export let id = '';
  export let deviceType = 'monitor';

  // Svelte stores
  import { airnow_selected } from '../stores/monitor-data-store.js';

  // let meta = $airnow_selected.getMetaObject(id);
  // Re-run whenever $airnow_selected or id changes
  $: meta =
    deviceType === 'monitor' && $airnow_selected && id
      ? $airnow_selected.getMetaObject(id)
      : null;
</script>

<!-- Note that sizing needs to be included as part of the element style. -->
<div id="{element_id}" style="width: {width}; height: {height};">


  {#if deviceType === "monitor" && meta}

    <span class="bold">{meta.locationName}</span><br>

    {#if meta.countryCode === 'US'}
      <span class="bold">{meta.countyName} county, </span>
    {/if}

    <span class="bold">{meta.stateCode}</span><br>

    Elevation:&nbsp;&nbsp;{#if meta.elevation != null}{Math.round(meta.elevation)} m{/if}<br>
    ID:&nbsp;&nbsp;{id}<br>
    AQSID:&nbsp;&nbsp;{meta.AQSID}<br>
    Source:&nbsp;&nbsp;{meta.dataIngestSource}<br>
    Deployment type:&nbsp;&nbsp;{meta.deploymentType}<br>
    Timezone:&nbsp;&nbsp;{meta.timezone}<br>

  {:else if deviceType === "monitor"}

    <!-- Optional fallback when metadata is not available for this id -->
    <div>
      No metadata available for this monitor at the selected time.
    </div>

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

</style>

