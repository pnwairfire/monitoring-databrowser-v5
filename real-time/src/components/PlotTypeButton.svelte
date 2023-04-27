<script>
  export let text = "Time series";
  export let type = "timeseries";
  import { selected_plot_type } from "../stores/gui-store.js";

  function handleClick() {
    $selected_plot_type = type;
  }
</script>

<button 
  on:click={handleClick} 
  class:selected={$selected_plot_type === type}>
  { text }
</button>

<style>
  .selected {
    font-weight: bold;
  }
</style>