// Leaflet map utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

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
