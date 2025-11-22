<script>
  import { selected_year, selected_datetime } from "../stores/gui-store.js";
  import { airnow } from "../stores/monitor-data-store.js";

  // Years the user can pick from (tweak as needed)
  export let years = [2022, 2023, 2024, 2025];

  // Ensure the store has a sensible default within the allowed list
  $: {
    const y = Number($selected_year) || years[years.length - 1];
    if (!years.includes(y)) {
      selected_year.set(years[years.length - 1]);
    }
  }

  // Derive min/max strings for the datetime-local input
  $: currentYear = Number($selected_year) || years[years.length - 1];
  $: min = `${currentYear}-01-01T00:00`;
  $: max = `${currentYear}-12-31T23:00`;

  // Reload AirNow data when the year changes
  let previousYear;
  $: if (currentYear && currentYear !== previousYear) {
    previousYear = currentYear;

    // Trigger async reload; loader uses selected_year internally
    if (typeof airnow.reload === "function") {
      console.log(`Reloading AirNow data for year ${currentYear}...`);
      airnow.reload();
    } else {
      console.warn("airnow store is not reloadable; cannot auto-reload on year change.");
    }
  }
</script>

<div class="year-datetime-picker">
  <div class="year-picker">
    <select bind:value={$selected_year}>
      {#each years as y}
        <option value={y}>{y}</option>
      {/each}
    </select>
  </div>

  <div class="datetime-picker">
    <input
      type="datetime-local"
      bind:value={$selected_datetime}
      step="3600"
      {min}
      {max}
    />
  </div>
</div>

<style>
  .year-datetime-picker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }


  select {
    font-family: "Source Sans Pro", "Helvetica", sans-serif;
    font-size: 16px;
    padding: 2px 4px;
    border: 1px solid #666;
    border-radius: 4px;
  }

  input[type="datetime-local"] {
    font-family: "Source Sans Pro", "Helvetica", sans-serif;
    font-size: 16px;             /* slightly smaller than .mv5 (24px) */
    padding: 2px 4px;
    margin-left: auto;           /* pushes input to the right */
    margin-right: 20px;          /* right margin */
  }

  input[type="datetime-local"]:hover {
    border-color: #aaa;
  }
</style>
