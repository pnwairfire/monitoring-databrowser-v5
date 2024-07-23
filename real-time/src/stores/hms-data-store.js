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

import Papa from "papaparse";
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

// Reloadable HMS Fires geojson data
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

// Reloadable HMS Fires csv data
export const hms_fires_csv = asyncReadable(
  {},
  async () => {
    //"https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Fire_Points/Text/2024/07/hms_fire20240718.txt";
    // https://airfire-data-exports.s3.us-west-2.amazonaws.com/dev/hms_fires/hms_fire20240718.txt
    const now = new Date();
    const year = now.toISOString().slice(0, 4);
    const month = now.toISOString().slice(5, 7);
    const day = now.toISOString().slice(8, 10);
    // const startString =
    //   "https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Fire_Points/Text";
    // const url = `${startString}/${year}/${month}/hms_fire${year}${month}${day}.txt`;
    // https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Fire_Points/Text

    // https://airfire-data-exports.s3.us-west-2.amazonaws.com/dev/hms_fires/hms_fire20240718.csv.gz
    const url =
      "https://airfire-data-exports.s3.us-west-2.amazonaws.com/hms/v2/data/hms_latest_mv5.csv";
    const response = await fetch(url);
    // const response = await fetch(url, {
    //   mode: "no-cors",
    // headers: {
    //   "Access-Control-Allow-Origin": "*",
    // },
    // });
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
      // purpleairCount.set(results.data.length);
      return results.data;
    }
  },
  { reloadable: true }
);
