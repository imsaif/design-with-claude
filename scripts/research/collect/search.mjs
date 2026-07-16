// GitHub code-search wrappers. Network — driven by the shared `gh` runner.
//
// Honesty constraints baked in (study #2 method doc §4 + sampling caveat):
//  - total_count is APPROXIMATE/volatile — counts files on indexed default
//    branches, not unique repos. Callers must present it as a directional floor.
//  - code search is relevance-ranked and hard-caps at 1,000 results. searchRepos
//    reports whether it hit that ceiling so the draft can disclose it.
//
// Rate discipline: GitHub's code-search endpoint allows ~10 requests/minute.
// We therefore (a) space every search request >= SEARCH_MIN_INTERVAL_MS apart,
// (b) fetch only the pages a sample needs (never unbounded --paginate), and
// (c) back off once on a 403 rate-limit before retrying.

import { fingerprintSpec } from "./fingerprints.mjs";

const SEARCH_MIN_INTERVAL_MS = 6500; // ~9 req/min, under the 10/min code-search cap
const RATE_LIMIT_BACKOFF_MS = 60_000;

let lastSearchAt = 0;

// Blocking sleep — keeps the collector fully synchronous (execFileSync-based).
function sleepSync(ms) {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function throttleSearch() {
  const wait = SEARCH_MIN_INTERVAL_MS - (Date.now() - lastSearchAt);
  sleepSync(wait);
  lastSearchAt = Date.now();
}

// One throttled search request, with a single rate-limit backoff+retry.
function searchRequest(gh, args) {
  throttleSearch();
  try {
    return gh(args);
  } catch (err) {
    const msg = String(err && err.message);
    if (msg.includes("rate limit") || msg.includes("HTTP 403")) {
      console.error(`  · code-search rate limit hit — backing off ${RATE_LIMIT_BACKOFF_MS / 1000}s...`);
      sleepSync(RATE_LIMIT_BACKOFF_MS);
      lastSearchAt = Date.now();
      return gh(args); // one retry; if it throws again it propagates
    }
    throw err;
  }
}

// Directional scale figure for a fingerprint. Returns a number (volatile).
export function searchCount(fingerprint, gh) {
  const { query } = fingerprintSpec(fingerprint);
  const out = searchRequest(gh, [
    "api", "-X", "GET", "search/code", "-f", `q=${query}`, "--jq", ".total_count",
  ]);
  return parseInt(out.trim(), 10);
}

// Unique repo full-names for a fingerprint, up to `limit` (GitHub caps at 1,000).
// Fetches only ceil(limit/100)+1 pages — never the whole result set.
// Returns { repos: string[], totalCount, hitCap: boolean }.
export function searchRepos(fingerprint, limit, gh) {
  const { query } = fingerprintSpec(fingerprint);
  const totalCount = searchCount(fingerprint, gh);

  const perPage = 100;
  const maxPages = Math.min(10, Math.ceil(limit / perPage) + 1); // GitHub cap = 10 pages of 100
  const collected = [];
  let hitCap = false;

  for (let page = 1; page <= maxPages; page++) {
    const out = searchRequest(gh, [
      "api", "-X", "GET", "search/code",
      "-f", `q=${query}`, "-f", `per_page=${perPage}`, "-f", `page=${page}`,
      "--jq", ".items[].repository.full_name",
    ]);
    const names = out.trim().split("\n").filter(Boolean);
    collected.push(...names);
    if (names.length < perPage) break;            // last page
    if (page === 10) hitCap = true;               // reached the relevance-ranked ceiling
    if ([...new Set(collected)].length >= limit) break;
  }

  const repos = [...new Set(collected)];
  return { repos: repos.slice(0, limit), totalCount, hitCap };
}
