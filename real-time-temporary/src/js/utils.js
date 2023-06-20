// Utility functions

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
