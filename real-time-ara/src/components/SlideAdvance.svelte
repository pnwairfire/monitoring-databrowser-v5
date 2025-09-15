<script>
	// Exports
	export let element_id = 'default-slide-advance';

  // Imports
  import {
    current_slide,
	} from '../stores/gui-store.js';

  function advanceSlide() {
    if ($current_slide === "hourly") {
      $current_slide = "all";
    } else if ($current_slide === "all") {
      $current_slide = "timeseries";
    } else if ($current_slide === "timeseries") {
      $current_slide = "daily";
    } else if ($current_slide === "daily") {
      $current_slide = "diurnal";
    } else if ($current_slide === "diurnal") {
      $current_slide = "hourly";
    }
  }
</script>

<button id="{element_id}" class="slide-advance"
        on:click={advanceSlide}>
    N<br>E<br>X<br>T
</button>

<style>
	.slide-advance {
    color: #8a6d3b;
    background-color: #e3f1fc;
    border: 1px solid #bbb;
    border-radius: 4px;
    margin: 50px 0px;
    padding: 10px;
    vertical-align: bottom;
	}
</style>