import Papa from "papaparse";
import { asyncReadable, writable, derived } from "@square/svelte-store";

import { purpleairCreateGeoJSON } from "../js/utils-purpleair.js";
import { error_message, purpleairCount } from "./gui-store.js";

// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object that will always stay
// NOTE:  up-to-date as data get periodically updated.

/**
 * A reloadable store containing the parsed PurpleAir CSV data.
 * Downloads and parses a public PurpleAir synoptic CSV file as an array of sensor objects.
 */
export const pas = asyncReadable(
  [],
  async () => {
    try {
      const response = await fetch(
        "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/purple_air/v4/pas.csv"
      );
      const text = await response.text();
      const results = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (results.errors.length > 0) {
        console.error("PurpleAir CSV parse error:", results.errors[0]);
        error_message.set("Error parsing PurpleAir data");
        return [];
      }

      console.log(`loaded pas data`);
      purpleairCount.set(results.data.length);
      return results.data;
    } catch (err) {
      console.error("Failed to load PurpleAir data:", err);
      error_message.set("Failed to load PurpleAir data");
      return [];
    }
  },
  { reloadable: true }
);

// ----- geojson ---------------------------------------------------------------

/**
 * Derived store that converts $pas synoptic data into GeoJSON.
 *
 * Unlike asyncReadable-based stores, this one updates automatically
 * whenever $pas changes, and does not require calling `.load()`.
 */
export const purpleair_geojson = derived(pas, ($pas) => {
  if (!$pas) return null; // still loading or unavailable
  try {
    return purpleairCreateGeoJSON($pas);
  } catch (err) {
    console.error("[purpleair_geojson] Failed to create GeoJSON:", err);
    return null;
  }
});

// ----- time series -----------------------------------------------------------

// NOTE: A PurpleAirTimeseries shopping cart based on:
// NOTE:   https://medium.com/@dkthelearner/implementing-a-shopping-cart-functionality-with-svelte-ec700b348251

const initialCartState = {
  items: [],
  count: 0,
};

/**
 * A custom store for managing a cart of PurpleAir time series sensor objects.
 * Each item is expected to have a unique `id`.
 */
function createCart() {
  const { subscribe, set, update } = writable(initialCartState);

  return {
    subscribe,

    addItem: (sensor) =>
      update((state) => {
        if (!state.items.find((item) => item.id === sensor.id)) {
          return {
            items: [...state.items, sensor],
            count: state.count + 1,
          };
        } else {
          console.log(`pat id ${sensor.id} is already loaded.`);
          return state;
        }
      }),

    removeItem: (sensor) =>
      update((state) => {
        const items = state.items.filter((item) => item.id !== sensor.id);
        return {
          items,
          count: items.length,
        };
      }),

    clear: () => set(initialCartState),
  };
}

export const patCart = createCart();
