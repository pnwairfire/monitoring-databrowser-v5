// Download utility functions
//

import { asyncReadable } from "@square/svelte-store";
import Pbf from "pbf";
import geobuf from "geobuf";

import { exclusion_ids, error_message } from "../stores/gui-store.js";

/**
 * Loads an exclusion list from a JSON file at the given URL
 * and stores it in `exclusion_ids`.
 *
 * @param {string} url - URL of the JSON file containing an array of IDs
 */
export async function loadExclusionList(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch exclusion list: ${response.status}`);
    }
    const ids = await response.json();

    // Normalize to strings and store in a Set
    exclusion_ids.set(new Set(ids.map(String)));
    console.log(`Loaded ${ids.length} exclusion IDs`);
  } catch (err) {
    console.error("Error loading exclusion list:", err);
    error_message.set("Failed to load exclusion list");
  }
}

/**
 * Create a reloadable asyncReadable store that loads GeoJSON from a remote URL.
 *
 * This abstracts away fetch/error logic so that each store can focus on exposing data.
 *
 * @param {string} url - Full URL to a valid GeoJSON (.geojson or JSON) file.
 * @param {string} label - A short identifier (e.g. "airnow", "wrcc") used in logs and error messages.
 * @returns {import('@square/svelte-store').AsyncReadable<Object|null>} A reloadable store containing the GeoJSON or null.
 */
export function loadGeojson(url, label) {
  return asyncReadable(
    null,
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        error_message.set(`Failed to load ${label} geojson`);
        const err_msg = `[${label}_geojson] Failed to fetch ${url}: ${response.status} ${response.statusText}`;
        console.error(err_msg);
        throw new Error(err_msg);
      }

      const geojson = await response.json();
      console.log(`loaded ${label} geojson`);
      return geojson;
    },
    { reloadable: true }
  );
}

/**
 * Create a reloadable asyncReadable store that loads a .pbf (geobuf) file and decodes it to GeoJSON.
 *
 * @param {string} url - Full URL to a .pbf file containing geobuf-encoded GeoJSON.
 * @param {string} label - A short identifier (e.g. "hms_smoke") used in logs and error messages.
 * @returns {import('@square/svelte-store').AsyncReadable<Object|null>} A reloadable store containing the decoded GeoJSON or null.
 */
export function loadGeobuf(url, label) {
  return asyncReadable(
    null,
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        error_message.set(`Failed to load ${label} geojson`);
        const err_msg = `[${label}_geojson] Failed to fetch ${url}: ${response.status} ${response.statusText}`;
        console.error(err_msg);
        throw new Error(err_msg);
      }

      const arrayBuffer = await response.arrayBuffer();
      const pbf = new Pbf(arrayBuffer);
      const geojson = geobuf.decode(pbf);

      console.log(`loaded ${label} geojson from .pbf`);
      return geojson;
    },
    { reloadable: true }
  );
}
