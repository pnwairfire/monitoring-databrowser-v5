// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object, "all_monitors", that will
// NOTE:  always stay up-to-date as data get periodically updated.

// npm install @square/svelte-store --save
import { asyncReadable, writable } from "@square/svelte-store";

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

// ----- time series -----------------------------------------------------------

// NOTE: A PurpleAirTimeseries shopping cart based on:
// NOTE:   https://medium.com/@dkthelearner/implementing-a-shopping-cart-functionality-with-svelte-ec700b348251

const initialState = {
  items: [],
  count: 0,
};

function createCart() {
  const { subscribe, set, update } = writable(initialState);
  return {
    subscribe,
    addItem: (id) =>
      update((state) => {
        // TODO:  await csv load at this point
        const pa_object = { id: id, csv: "abcd" };
        const index = state.items.findIndex((item) => item.id === pa_object.id);
        if (index !== -1) {
          console.log("pat id: " + id + " is already loaded.");
        } else {
          state.items.push({ pa_object });
          state.count += 1;
        }
        return state;
      }),
    removeItem: (id) =>
      update((state) => {
        const index = state.items.findIndex((item) => item.id === id);
        if (index !== -1) {
          state.items.splice(index, 1);
          state.count -= 1;
        }
        return state;
      }),
    clear: () => set(initialState),
  };
}
export const patCart = createCart();
