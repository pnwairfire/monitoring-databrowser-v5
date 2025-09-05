// General utility functions
//
// NOTE:  These functions do not need access to any reactive variables.

/**
 * Update the URL (without reloading) to reflect current map state.
 * Accepts numeric center/zoom and string[] id lists.
 *
 * @param {number | null | undefined} centerlat
 * @param {number | null | undefined} centerlon
 * @param {number | null | undefined} zoom
 * @param {string[] | string | null | undefined} monitor_ids
 * @param {string[] | string | null | undefined} clarity_ids
 * @param {string[] | string | null | undefined} purpleair_ids
 */
export function replaceWindowHistory(
  centerlat,
  centerlon,
  zoom,
  monitor_ids,
  clarity_ids,
  purpleair_ids
) {
  const params = new URLSearchParams();

  // numbers: accept finite numbers; ignore null/undefined/NaN
  if (Number.isFinite(centerlat)) {
    params.set("centerlat", (Math.round(centerlat * 10000) / 10000).toString());
  }
  if (Number.isFinite(centerlon)) {
    params.set("centerlon", (Math.round(centerlon * 10000) / 10000).toString());
  }
  if (Number.isFinite(zoom)) {
    params.set("zoom", Number(zoom).toString());
  }

  // normalize lists: allow string[] or a comma-delimited string; drop empties; de-dupe; stable sort
  const normList = (v) => {
    const arr =
      Array.isArray(v) ? v :
      (typeof v === "string" ? v.split(",") : []);
    const cleaned = arr.map(s => String(s).trim()).filter(Boolean);
    // optional: stabilize order so the URL is deterministic for same selection
    return Array.from(new Set(cleaned)).sort();
  };

  const monitors = normList(monitor_ids);
  const purpleair = normList(purpleair_ids);
  const clarity = normList(clarity_ids);

  if (monitors.length) params.set("monitors", monitors.join(","));
  if (purpleair.length) params.set("purpleair", purpleair.join(","));
  if (clarity.length) params.set("clarity", clarity.join(","));

  const base = window.location.origin + window.location.pathname;
  const qs = params.toString();
  const url = qs ? `${base}?${qs}` : base;

  window.history.replaceState(null, "Monitoring v5", url);
}

/**
 * Parse strongly-typed values out of the current window location.
 * Returns numbers for center/zoom and string[] for id lists.
 */
export function parseWindowQueryParams() {
  const params = new URLSearchParams(window.location.search);

  const result = /** @type {{
    centerlat?: number,
    centerlon?: number,
    zoom?: number,
    monitors?: string[],
    purpleair?: string[],
    clarity?: string[]
  }} */ ({});

  const toNum = (s, parser) => {
    const n = parser(s);
    return Number.isFinite(n) ? n : undefined;
  };
  const toList = (s) =>
    s.split(",").map(x => x.trim()).filter(Boolean);

  if (params.has("centerlat")) {
    const v = toNum(params.get("centerlat"), parseFloat);
    if (v !== undefined) result.centerlat = v;
  }
  if (params.has("centerlon")) {
    const v = toNum(params.get("centerlon"), parseFloat);
    if (v !== undefined) result.centerlon = v;
  }
  if (params.has("zoom")) {
    const v = toNum(params.get("zoom"), (x) => parseInt(x, 10));
    if (v !== undefined) result.zoom = v;
  }
  if (params.has("monitors")) {
    result.monitors = toList(params.get("monitors"));
  }
  if (params.has("purpleair")) {
    result.purpleair = toList(params.get("purpleair"));
  }
  if (params.has("clarity")) {
    result.clarity = toList(params.get("clarity"));
  }

  return result;
}

// Create data-service URL
export function createDataServiceUrl(ids = []) {
  const baseUrl = "https://tools.airfire.org/monitor-data/v2/data";
  const monitorids = ids.reduce((a, o) => a + "," + o);
  const url = baseUrl + "?" + "monitorids=" + ids;
  return url;
}

// Create aqi-nowcast-service URL
// https://tools.airfire.org/monitor-custom/v2/dailyhourlybarplot?outputfiletype=pdf&lookbackdays=10&monitors=f30ef89ce91eb5b4_840160150002
export function createAQINowCastServiceUrl(ids = []) {
  const baseUrl = "https://tools.airfire.org/monitor-custom/v2/dailyhourlybarplot";
  const monitorids = ids.reduce((a, o) => a + "," + o);
  const url = baseUrl + "?" + "monitorids=" + ids + "&days=10&filetype=pdf";
  return url;
}
