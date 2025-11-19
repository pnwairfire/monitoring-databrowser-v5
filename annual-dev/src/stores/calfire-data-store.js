// -----------------------------------------------------------------------------
// calfire-data-store.js
//
// Async-readable store that loads and normalizes CalFire GeoJSON into a
// FeatureCollection with Monitoring v5–friendly properties.
// -----------------------------------------------------------------------------

import { DateTime } from "luxon";
import { asyncReadable, writable } from "@square/svelte-store";
import { error_message, calfireFireCount } from "./gui-store.js";

/**
 * Normalize the CalFire GeoJSON into a FeatureCollection with cleaned properties.
 *
 * - Keeps geometry as-is (Point, [lon, lat])
 * - Renames properties to lower_snake_case
 * - Coerces numeric fields to numbers
 *
 * @param {Object} calfireGeoJSON Original CalFire FeatureCollection
 * @returns {Object} Normalized GeoJSON FeatureCollection
 */
function calfireToGeoJSON(calfireGeoJSON) {
  if (!calfireGeoJSON || calfireGeoJSON.type !== "FeatureCollection") {
    return { type: "FeatureCollection", features: [] };
  }

  const features = (calfireGeoJSON.features || [])
    .map((feature) => {
      if (!feature || feature.type !== "Feature") return null;

      const geom = feature.geometry || {};
      const coords = geom.coordinates || [];
      const lon = coords[0];
      const lat = coords[1];

      if (
        !geom ||
        geom.type !== "Point" ||
        !Array.isArray(coords) ||
        coords.length < 2 ||
        !Number.isFinite(lon) ||
        !Number.isFinite(lat)
      ) {
        return null;
      }

      const p = feature.properties || {};

      const acres =
        p.AcresBurned != null && p.AcresBurned !== ""
          ? Number(p.AcresBurned)
          : null;

      const contained =
        p.PercentContained != null && p.PercentContained !== ""
          ? Number(p.PercentContained)
          : null;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        properties: {
          // Stable ID for linking / tooltips
          id: p.UniqueId ?? null,

          // Naming / classification
          name: p.Name ?? "",
          type: p.Type ?? "",
          county: p.County ?? "",
          location: p.Location ?? "",
          admin_unit: p.AdminUnit ?? "",
          admin_unit_url: p.AdminUnitUrl ?? null,

          // Status
          active: Boolean(p.IsActive),
          final: Boolean(p.Final),
          calfire_incident: Boolean(p.CalFireIncident),

          // Fire metrics
          acres,
          percent_contained: contained,

          // Timing
          updated: p.Updated ?? null,
          started: p.Started ?? null,
          started_date: p.StartedDateOnly ?? null,
          extinguished_date: p.ExtinguishedDate || null,
          extinguished_date_only: p.ExtinguishedDateOnly || null,

          // Links / misc
          url: p.Url || null,
          agency_names: p.AgencyNames ?? "",
          control_statement: p.ControlStatement ?? "",
          notification_desired: Boolean(p.NotificationDesired),

          // Original lat/lon fields (duplicative but may be handy)
          latitude: p.Latitude ?? lat,
          longitude: p.Longitude ?? lon,
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

const CALFIRE_URL =
  "https://airfire-data-exports.s3.us-west-2.amazonaws.com/calfire/incidents_active.geojson";

export const calfireLoadTime = writable(0);

// ----- store -----------------------------------------------------------------

/**
 * Async-readable store that loads and converts the CalFire GeoJSON.
 *
 * @example
 *   $calfire_geojson -> GeoJSON FeatureCollection
 */
export const calfire_geojson = asyncReadable(
  null,
  async () => {
    const start = DateTime.now();
    try {
      const response = await fetch(CALFIRE_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const rawGeoJSON = await response.json();
      const geojson = calfireToGeoJSON(rawGeoJSON);

      const end = DateTime.now();
      const elapsed =
        Math.round(10 * end.diff(start, "seconds").seconds) / 10;

      calfireLoadTime.set(elapsed);
      calfireFireCount.set(geojson.features.length);

      console.log(
        `Loaded ${geojson.features.length} CalFire features in ${elapsed} seconds.`
      );

      return geojson;
    } catch (err) {
      console.error("Failed to load CalFire data:", err);
      error_message.set("Failed to load CalFire data");
      return null; // or: throw err;
    }
  },
  { reloadable: true }
);
