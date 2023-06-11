<script>
	// Exports
	export let element_id = 'default-slide-advance';

  // Imports
  import {
    r1_slide,
	} from '../stores/gui-store.js';

  function advanceSlide() {
    if ($r1_slide === "all") {
      $r1_slide = "timeseries";
    } else if ($r1_slide === "timeseries") {
      $r1_slide = "hourly";
    } else if ($r1_slide === "hourly") {
      $r1_slide = "daily";
    } else if ($r1_slide === "daily") {
      $r1_slide = "diurnal";
    } else if ($r1_slide === "diurnal") {
      $r1_slide = "all";
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