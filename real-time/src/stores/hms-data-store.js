// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object that will always stay
// NOTE:  up-to-date as data get periodically updated.

// npm install @square/svelte-store --save
import { asyncReadable, derived, writable } from "@square/svelte-store";

import { error_message } from "./gui-store.js";

import Pbf from "pbf";
import geobuf from "geobuf";

// ----- geojson ---------------------------------------------------------------

// Reloadable HMS Smoke geojson data
export const hms_smoke_geojson = asyncReadable(
  {},
  async () => {
    const response = await fetch(
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/geobuf/latest_smoke.pbf"
    );
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const pbf = new Pbf(arrayBuffer);
      const geojson = geobuf.decode(pbf);
      console.log("loaded HMS smoke geojson");
      return geojson;
    } else {
      error_message.set("Failed to load HMS smoke geojson");
      throw new Error(response.message);
    }
  },
  { reloadable: true }
);

// Reloadable HMS Smoke geojson data
export const hms_fires_geojson = asyncReadable(
  {},
  async () => {
    const response = await fetch(
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/geobuf/latest_fire.pbf"
    );
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const pbf = new Pbf(arrayBuffer);
      const geojson = geobuf.decode(pbf);
      console.log("loaded HMS fires geojson");
      return geojson;
    } else {
      error_message.set("Failed to load HMS fires geojson");
      throw new Error(response.message);
    }
  },
  { reloadable: true }
);
