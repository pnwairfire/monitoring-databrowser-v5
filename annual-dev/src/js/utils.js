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
 */
export function replaceWindowHistory(
  centerlat,
  centerlon,
  zoom,
  monitor_ids
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

  if (monitors.length) params.set("monitors", monitors.join(","));

  const base = window.location.origin + window.location.pathname;
  const qs = params.toString();
  const url = qs ? `${base}?${qs}` : base;

  window.history.replaceState(null, "Monitoring v5", url);
}

/**
 * Parse strongly-typed values out of the current window location.
 *
 * Returns numbers for center/zoom and string[] for id lists.
 *
 * @returns {{
 *   centerlat?: number,
 *   centerlon?: number,
 *   zoom?: number,
 *   monitors?: string[]
 * }}
 */
export function parseWindowQueryParams() {
  const params = new URLSearchParams(window.location.search);

  // Helpers
  const toNum = (s, parser) => {
    const n = parser(s);
    return Number.isFinite(n) ? n : undefined;
  };
  const toList = (s) =>
    s.split(",").map(x => x.trim()).filter(Boolean);

  // Build result object
  const result = {};

  // Numbers
  if (params.has("centerlat")) {
    result.centerlat = toNum(params.get("centerlat"), parseFloat);
  }
  if (params.has("centerlon")) {
    result.centerlon = toNum(params.get("centerlon"), parseFloat);
  }
  if (params.has("zoom")) {
    result.zoom = toNum(params.get("zoom"), (x) => parseInt(x, 10));
  }

  // Lists
  if (params.has("monitors")) {
    result.monitors = toList(params.get("monitors"));
  }

  return result;
}
