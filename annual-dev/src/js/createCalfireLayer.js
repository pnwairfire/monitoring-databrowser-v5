// -----------------------------------------------------------------------------
// createCalfireLayer.js
//
// Create a Leaflet layer for CalFire fire incidents using normalized
// GeoJSON from the `calfire_geojson` store.
// -----------------------------------------------------------------------------

import L from "leaflet";
import { DateTime } from "luxon";

// --- local helper -----------------------------------------------------------

function formatAgo(isoString) {
  if (!isoString) return "";

  const t = DateTime.fromISO(isoString, { zone: "utc" });
  if (!t.isValid) return "";

  const now = DateTime.utc();
  const diff = now.diff(t, ["days", "hours", "minutes"]).toObject();

  const parts = [];
  if (diff.days >= 1)
    parts.push(`${Math.floor(diff.days)} day${diff.days >= 2 ? "s" : ""}`);
  if (diff.hours >= 1)
    parts.push(`${Math.floor(diff.hours)} hour${diff.hours >= 2 ? "s" : ""}`);
  if (diff.minutes >= 1)
    parts.push(`${Math.floor(diff.minutes)} minute${diff.minutes >= 2 ? "s" : ""}`);

  if (parts.length === 0) return "just now";

  return parts.join(" ") + " ago";
}

/**
 * Create a Leaflet layer for CalFire fire incidents.
 *
 * @param {Object} geojson - GeoJSON FeatureCollection from calfire_geojson store.
 * @returns {L.Layer} Leaflet layer suitable for insertion via replaceLayerContent().
 */
export function createCalfireLayer(geojson) {
  if (!geojson || !geojson.features) return L.layerGroup(); // keep consistent return type

  // Small "cool blue" flame icons, styled via CSS
  const iconActive = L.divIcon({
    className: "calfire-icon active",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        text-align: center;
        line-height: 20px;
        font-size: 0.85rem;
        filter: hue-rotate(200deg) saturate(1.4);
      ">
        🔥
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const iconInactive = L.divIcon({
    className: "calfire-icon inactive",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        text-align: center;
        line-height: 20px;
        font-size: 0.85rem;
        filter: hue-rotate(200deg) saturate(1.4);
      ">
        🔥
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const formatNumber = (value) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("en-US")
      : value ?? "";

  const safeText = (value) => (value == null || value === "" ? "" : String(value));

  // Build an L.GeoJSON layer, similar to other create...Layer() functions
  const layer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      const { active, final } = feature.properties || {};
      // Treat "active" as primary, fall back to inactive icon for final incidents
      const icon = active ? iconActive : iconInactive;
      return L.marker(latlng, { icon });
    },

    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};

      const name = safeText(p.name) || "Unnamed Incident";
      const type = safeText(p.type) || "Incident";
      const county = safeText(p.county);
      const location = safeText(p.location);
      const adminUnit = safeText(p.admin_unit);
      const acres = p.acres != null ? formatNumber(p.acres) : "";
      const contained =
        p.percent_contained != null ? `${p.percent_contained}%` : "";
      const started = safeText(p.started_date || p.started);
      const updated = formatAgo(p.updated);
      const extinguished =
        safeText(p.extinguished_date_only || p.extinguished_date);

      const url = p.url || null;
      const adminUrl = p.admin_unit_url || null;

      const statusParts = [];
      if (p.active) statusParts.push("Active");
      if (p.final) statusParts.push("Final");
      if (p.calfire_incident) statusParts.push("CalFire Incident");
      const status = statusParts.join(" · ");

      const popup = `
        <div class="calfire-popup">
          <div class="calfire-popup-title"
               style="font-size: 1.2rem; margin-bottom: 0.75rem;">
            ${name}
          </div>
          <div class="calfire-popup-content">
            <strong>Incident Type:</strong> ${type}<br>
            ${
              updated
                ? `<strong>Updated:</strong> ${updated}<br>`
                : ""
            }
            ${
              acres
                ? `<strong>Size:</strong> ${acres} Acres<br>`
                : ""
            }
            ${
              contained
                ? `<strong>Contained:</strong> ${contained}<br>`
                : ""
            }
            <br>
            ${
              url
                ? `<a href="${url}" target="_blank" rel="noopener noreferrer">View on CalFire</a><br>`
                : ""
            }
          </div>
        </div>
      `;

      // Other possible popup items:
            // ${status ? `<strong>Status:</strong> ${status}<br>` : ""}
            // ${county ? `<strong>County:</strong> ${county}<br>` : ""}
            // ${location ? `<strong>Location:</strong> ${location}<br>` : ""}
            // ${adminUnit ? `<strong>Admin Unit:</strong> ${adminUnit}<br>` : ""}
            // ${
            //   started
            //     ? `<strong>Started:</strong> ${started}<br>`
            //     : ""
            // }
            // ${
            //   extinguished
            //     ? `<strong>Extinguished:</strong> ${extinguished}<br>`
            //     : ""
            // }
            // ${
            //   adminUrl
            //     ? `<a href="${adminUrl}" target="_blank" rel="noopener noreferrer">Admin Unit info</a><br>`
            //     : ""
            // }


      layer.bindPopup(popup, { maxWidth: 320 });
    },
  });

  return layer;
}
