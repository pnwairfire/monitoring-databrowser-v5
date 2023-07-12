// Leaflet map utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

// npm install papaparse
import Papa from "papaparse";

import { pm25ToColor } from "air-monitor-plots";

/* ----- Monitor functions -------------------------------------------------- */

// Icon style
export function monitorPropertiesToIconOptions(properties) {
  const latency = parseInt(properties["last_latency"]);
  const options = {
    radius: properties["deploymentType"] == "Temporary" ? 7 : 8,
    shape:
      properties["deploymentType"] == "Temporary" ? "triangle-up" : "circle",
    fillColor: latency > 4 ? "#bbb" : pm25ToColor(properties["last_PM2.5"]),
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
  return options;
}

/* ----- Sensor functions --------------------------------------------------- */

export function sensorCreateGeoJSON(synopticData) {
  // 'pas' synopticData
  //
  // epa_nowcast: 7.7
  // epa_pm25: 7.2
  // latitude: 45.031963
  // longitude: -110.71382
  // raw_pm25: 4.4
  // sensor_index: 154193
  // timezone: "America/Denver"
  // utc_ts: "2023-07-11 21:00:00+0000"

  let features = Array(synopticData.length);

  let bop = 1;

  for (let i = 0; i < synopticData.length; i++) {
    let site = synopticData[i];
    features[i] = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [site.longitude, site.latitude],
      },
      properties: {
        deviceDeploymentID: site.sensor_index,
        locationName: "PurpleAir " + site.sensor_index,
        epa_nowcast: site.epa_nowcast,
        epa_pm25: site.epa_pm25,
        raw_pm25: site.raw_pm25,
        timezone: site.timezone,
        utc_ts: site.utc_ts,
        latency: (new Date() - new Date(site.utc_ts)) / (1000 * 3600),
      },
    };
  }

  let geojsonObj = {
    type: "FeatureCollection",
    features: features,
  };

  return geojsonObj;
}

// Icon style
export function sensorPropertiesToIconOptions(properties) {
  const options = {
    radius: 4,
    shape: "square",
    fillColor:
      properties.latency > 4 ? "#bbb" : pm25ToColor(properties.epa_pm25),
    color: "#000",
    weight: 1,
    opacity: 0.2,
    fillOpacity: 0.6,
  };
  return options;
}
