// Leaflet map utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

import { DateTime } from "luxon";
import { pm25ToColor } from "air-monitor-plots";

/* ----- Monitor functions -------------------------------------------------- */

// Icon style
export function monitorPropertiesToIconOptions(properties) {
  const latency = parseInt(properties.last_latency);
  const options = {
    radius: properties.deploymentType == "Temporary" ? 7 : 8,
    shape:
      properties["deploymentType"] == "Temporary" ? "triangle-up" : "circle",
    fillColor:
      latency > 4 ? "#bbb" : pm25ToColor(Number(properties.last_nowcast)),
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
  return options;
}

/* ----- PurpleAir functions ------------------------------------------------ */

/**
 * Converts a PurpleAir synoptic CSV-style array into a GeoJSON FeatureCollection.
 *
 * 'pas' synopticData:
 *   epa_nowcast: 7.7
 *   epa_pm25: 7.2
 *   latitude: 45.031963
 *    longitude: -110.71382
 *   raw_pm25: 4.4
 *   sensor_index: 154193
 *   timezone: "America/Denver"
 *   utc_ts: "2023-07-11 21:00:00+0000"
 *
 * @param {Array<Object>} synopticData - Array of sensor records with fields like `latitude`, `longitude`, `epa_pm25`, etc.
 * @returns {Object} A GeoJSON FeatureCollection of PurpleAir sensor points.
 */
export function purpleairCreateGeoJSON(synopticData) {
  const now = DateTime.utc();

  const features = synopticData.map((site) => {
    const siteTime = DateTime.fromISO(site.utc_ts, { zone: "utc" });
    const latency = now.diff(siteTime, "hours").hours;

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [site.longitude, site.latitude],
      },
      properties: {
        deviceDeploymentID: String(site.sensor_index),
        locationName: `PurpleAir ${site.sensor_index}`,
        epa_nowcast: site.epa_nowcast,
        epa_pm25: site.epa_pm25,
        raw_pm25: site.raw_pm25,
        timezone: site.timezone,
        utc_ts: site.utc_ts,
        latency: latency,
      },
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

// Icon style
export function purpleairPropertiesToIconOptions(properties) {
  const options = {
    radius: 4,
    shape: "square",
    fillColor:
      properties.latency > 4
        ? "#bbb"
        : pm25ToColor(Number(properties.epa_nowcast)),
    color: "#000",
    weight: 1,
    opacity: 0.2,
    fillOpacity: 0.6,
  };
  return options;
}

/* ----- Clarity functions -------------------------------------------------- */

// Icon style
export function clarityPropertiesToIconOptions(properties) {
  const latency = parseInt(properties.last_latency);
  const options = {
    radius: 4,
    shape: "diamond",
    fillColor:
      latency > 4 ? "#bbb" : pm25ToColor(Number(properties.last_nowcast)),
    color: "#000",
    weight: 1,
    opacity: 0.2,
    fillOpacity: 0.6,
  };
  return options;
}

/* ----- HMS fires functions ------------------------------------------------- */

// Icon style
export function HMSFiresPropertiesToIconOptions(properties) {
  const fireDot = L.icon({
    iconUrl: "images/fire-dot.png",
    iconSize: [6, 6],
  });
  const options = {
    icon: fireDot,
  };
  return options;
}
