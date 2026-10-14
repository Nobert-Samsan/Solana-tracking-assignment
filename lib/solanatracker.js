const BASE = "https://data.solanatracker.io";

export class ApiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

function getKeys() {
  return (process.env.SOLANA_TRACKER_API_KEYS || process.env.SOLANA_TRACKER_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/**
 * GET a SolanaTracker Data API path (server-side only).
 * Tries each configured key; moves to the next only if the key is rejected (401/403) or rate limited (429).
 * Throws ApiError with a user-friendly message and an HTTP status.
 */
export async function stFetch(path) {
  const keys = getKeys();
  if (!keys.length) {
    throw new ApiError("No API key configured. Add SOLANA_TRACKER_API_KEYS to .env.local and restart the server.", 500);
  }

  let status = 502;
  let message = "Could not reach SolanaTracker.";

  for (const key of keys) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { "x-api-key": key, accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) return await res.json();

      status = res.status;
      message =
        res.status === 429 ? "Rate limit reached. Wait a moment and try again."
        : res.status === 401 || res.status === 403 ? "The API key was rejected."
        : res.status === 404 ? "Not found."
        : `SolanaTracker returned an error (${res.status}).`;

      if (![401, 403, 429].includes(res.status)) break;
    } catch {
      status = 502;
      message = "Could not reach SolanaTracker. Check your connection.";
    }
  }
  throw new ApiError(message, status);
}
