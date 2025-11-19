
import { loadGeobuf } from "../js/utils-loaders.js";
import { error_message, hmsFiresCount } from "./gui-store.js";

// NOTE:  The @square/svelte-store replacement for svelte-store is
// NOTE:  Incredibly helpful for us. The problem it solves is explained here:
// NOTE:    https://github.com/sveltejs/svelte/issues/8011
// NOTE:  More details and examples are given here:
// NOTE:    https://github.com/square/svelte-store

// NOTE:  Basically, it allows us to abstract away the async/await aspects of
// NOTE:  fetching data and create a derived object that will always stay
// NOTE:  up-to-date as data get periodically updated.

// This file is a geobuf-encoded PBF file (protobuf binary) representing a GeoJSON FeatureCollection
const HMS_SMOKE_PBF_URL = "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/geobuf/latest_smoke.pbf";

// Geobuf file from Stuart Ilson
const HMS_FIRES_PBF_URL = "https://airfire-data-exports.s3.us-west-2.amazonaws.com/maps/geobuf/latest_fire.pbf";

// ----- geojson ---------------------------------------------------------------

// Reloadable HMS Smoke geojson data
export const hms_smoke_geojson = loadGeobuf(HMS_SMOKE_PBF_URL, "hms_smoke");

export const hms_fires_geojson = loadGeobuf(HMS_FIRES_PBF_URL, "hms_fire");

// Watch for updates and update the count
hms_fires_geojson.subscribe((geojson) => {
  if (geojson && geojson.features) {
    hmsFiresCount.set(geojson.features.length);
  } else {
    hmsFiresCount.set(0);
  }
});