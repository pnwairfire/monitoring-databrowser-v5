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
          <div class="inciweb-popup-title"
               style="font-size: 1.2rem; margin-bottom: 1rem;">
            ${p.title || "Unnamed Incident"}
          </div>
          <div class="inciweb-popup-content">
            <strong>Incident Type:</strong> ${p.type || "Incident"}<br>
            ${p.changed ? `<strong>Updated:</strong> ${p.changed}<br>` : ""}
            ${
              p.size
                ? `<strong>Size:</strong> ${p.size} ${p.measurement_type || ""}<br>`
                : ""
            }
            ${
              p.percent_of_perimeter
                ? `<strong>Contained:</strong> ${p.percent_of_perimeter}%<br>`
                : ""
            }
            <br>
            ${
              p.url
                ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer">View on Inciweb</a><br>`
                : ""
            }
          </div>
        </div>
      `;
      layer.bindPopup(popup, { maxWidth: 300 });
    },
  });

  return layer;
}
