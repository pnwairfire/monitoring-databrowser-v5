// Utility functions

// Replace window history without reloading a page.
export function replaceWindowHistory(
  centerlat = "",
  centerlon = "",
  zoom = "",
  monitors = ""
) {
  let base = window.location.origin + window.location.pathname;

  if (centerlat !== "") {
    centerlat = "centerlat=" + Math.round(centerlat * 10000) / 10000;
  }

  if (centerlon !== "") {
    centerlon = "centerlon=" + Math.round(centerlon * 10000) / 10000;
  }

  if (zoom !== "") {
    zoom = "zoom=" + zoom;
  }

  if (monitors !== "" && monitors.length > 0) {
    monitors = "monitors=" + monitors.reduce((a, o) => a + "," + o);
  }

  const url =
    base + "?" + centerlat + "&" + centerlon + "&" + zoom + "&" + monitors;

  window.history.replaceState("dummy", "Monitoring v5", url);
}

// Create data-service URL
export function createDataServiceUrl(ids = []) {
  const baseUrl = "https://tools.airfire.org/monitor-data/v2/data";
  const monitorids = ids.reduce((a, o) => a + "," + o);
  const url = baseUrl + "?" + "monitorids=" + ids;
  return url;
}

// Create data-service URL
export function createQCServiceUrl(aggregator, id) {
  let url;
  const baseUrl = "https://tools.airfire.org/monitor-qc-report/v2/";
  const provider = id.split(".")[0];
  const unit_id = id.split(".")[1];
  if (aggregator === "airsis") {
    url = baseUrl + "airsis?provider=" + provider + "&unitID=" + unit_id;
  } else if (aggregator === "wrcc") {
    url = baseUrl + "wrcc?unitID=" + unit_id;
  } else {
    throw new Error("unrecognized aggregator: " + aggregator);
  }
  return url;
}
