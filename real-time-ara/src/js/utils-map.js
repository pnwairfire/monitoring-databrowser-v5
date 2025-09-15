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
