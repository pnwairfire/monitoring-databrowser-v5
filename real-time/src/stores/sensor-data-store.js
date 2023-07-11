// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object, "all_monitors", that will
// NOTE:  always stay up-to-date as data get periodically updated.

// npm install @square/svelte-store --save
import { asyncReadable, derived, writable } from "@square/svelte-store";

import { error_message } from "./gui-store.js";

// npm install papaparse
import Papa from "papaparse";

// ----- geojson ---------------------------------------------------------------

// Reloadable met statistics
export const pas = asyncReadable(
  {},
  async () => {
    const response = await fetch(
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/purple_air/v2/pas.csv"
    );
    const text = await response.text();
    const results = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    if (results.errors.length > 0) {
      // throw new Error('An error occurred!');
      // TOOD:  Write this to a status field in gui-store.js
      console.log(results.error[0]);
      return [];
    } else {
      return results.data;
    }
  },
  { reloadable: true }
);
