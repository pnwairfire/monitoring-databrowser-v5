import { DateTime } from "luxon";
import { asyncReadable, writable } from "@square/svelte-store";
import { error_message, inciwebFireCount } from "./gui-store.js";

/**
 * Convert degrees–minutes–seconds strings into decimal degrees.
 *
 * @param {string} deg
 * @param {string} min
 * @param {string} sec
 * @returns {number|null}
 */
function dmsToDecimal(deg, min, sec) {
  if (deg == null || deg === "") return null;
  const d = parseFloat(deg);
  const m = parseFloat(min || 0);
  const s = parseFloat(sec || 0);
  const sign = d < 0 ? -1 : 1;
  return sign * (Math.abs(d) + m / 60 + s / 3600);
}

/**
 * Convert the Inciweb JSON array into a GeoJSON FeatureCollection.
 *
 * Removes redundant "field_" prefixes from property names.
 *
 * @param {Array<Object>} jsonArray
 * @returns {Object} GeoJSON FeatureCollection
 */
function inciwebToGeoJSON(jsonArray) {
  const features = jsonArray
    .map((item) => {
      const lat = dmsToDecimal(item.lat_deg, item.lat_min, item.lat_sec);
      // NOTE:  longitudes provided in deg W (no negative sign)
      const lon =
        -1.0 * dmsToDecimal(item.long_deg, item.long_min, item.long_sec);
      if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return null;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        properties: {
          id: item.id,
          title: item.title,
          type: item.type,
          active: item.active === "1",
          percent_of_perimeter: item.percent_of_perimeter
            ? Number(item.percent_of_perimeter)
            : null,
          description: item.incident_description || "",
          overview: item.incident_overview || "",
          size: item.size ? Number(item.size) : null,
          measurement_type: item.measurement_type,
          title_and_unit: item.title_and_unit,
          unit_code: item.unit_code,
          created: item.created,
          changed: item.changed,
          url: item.urlPath ? `https://inciweb.nwcg.gov${item.urlPath}` : null,
        },
      };
    })
    .filter(Boolean);

  return {
    type: "FeatureCollection",
    features,
  };
}

// ----- configuration ---------------------------------------------------------

const INCIWEB_URL = "https://inciweb.wildfire.gov/api/map_data";
export const inciwebLoadTime = writable(0);

// ----- store -----------------------------------------------------------------

/**
 * Async-readable store that loads and converts the Inciweb JSON to GeoJSON.
 *
 * @example
 *   $inciweb_geojson -> GeoJSON FeatureCollection
 */
export const inciweb_geojson = asyncReadable(
  null,
  async () => {
    const start = DateTime.now();
    try {
      const response = await fetch(INCIWEB_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();

      // Drop "field_" prefixes before conversion
      const cleaned = json.map((item) => {
        const newItem = {};
        for (const [key, value] of Object.entries(item)) {
          newItem[key.replace(/^field_/, "")] = value;
        }
        return newItem;
      });

      const geojson = inciwebToGeoJSON(cleaned);

      const end = DateTime.now();
      const elapsed = Math.round(10 * end.diff(start, "seconds").seconds) / 10;
      inciwebLoadTime.set(elapsed);
      inciwebFireCount.set(geojson.features.length);
      console.log(
        `Loaded Inciweb data in ${elapsed} s (${geojson.features.length} features)`
      );

      return geojson;
    } catch (err) {
      console.error("Failed to load Inciweb data:", err);
      error_message.set("Failed to load Inciweb data");
      return null; // throw err;
    }
  },
  { reloadable: true }
);
