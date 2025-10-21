import L from "leaflet";

/**
 * Create a Leaflet layer for Inciweb fire incidents.
 *
 * @param {Object} geojson - GeoJSON FeatureCollection from inciweb_geojson store.
 * @returns {L.Layer} Leaflet layer suitable for insertion via replaceLayerContent().
 */
export function createInciwebLayer(geojson) {
  if (!geojson || !geojson.features) return L.layerGroup(); // keep consistent return type

  // Define small flame icons
  const iconActive = L.divIcon({
    className: "inciweb-icon active",
    html: "🔥",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const iconInactive = L.divIcon({
    className: "inciweb-icon inactive",
    html: "🔥",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  // Build an L.GeoJSON layer, similar to other create...Layer() functions
  const layer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      const { active } = feature.properties;
      const icon = active ? iconActive : iconInactive;
      return L.marker(latlng, { icon });
    },
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      const popup = `
        <div class="inciweb-popup">
          <strong>${p.title || "Unnamed Incident"}</strong><br>
          <em>${p.type || "Incident"}</em><br>
          <b>Status:</b> ${p.active ? "🔥 Active" : "✅ Contained"}<br>
          ${
            p.size
              ? `<b>Size:</b> ${p.size} ${p.measurement_type || ""}<br>`
              : ""
          }
          ${
            p.percent_of_perimeter
              ? `<b>Contained:</b> ${p.percent_of_perimeter}%<br>`
              : ""
          }
          ${
            p.url
              ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer">View on Inciweb</a><br>`
              : ""
          }
          ${
            p.overview
              ? `<details><summary>Overview</summary>${p.overview}</details>`
              : ""
          }
          ${p.created ? `<small>Created: ${p.created}</small><br>` : ""}
          ${p.changed ? `<small>Updated: ${p.changed}</small>` : ""}
        </div>
      `;
      layer.bindPopup(popup, { maxWidth: 300 });
    },
  });

  return layer;
}
