/**
 * Axios wrapper with retry, exponential backoff and an injectable inter-request
 * delay so ETL modules can stay polite to free public APIs.
 */
const axios = require('axios');
const http = require('http');
const https = require('https');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Reuse sockets so concurrent requests don't pile up TLS error-listeners and
// trigger Node's MaxListenersExceeded warning at >10 in-flight calls.
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 32 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 32 });

/**
 * Run `fn(item, index)` over `items` with at most `concurrency` in-flight
 * promises. Preserves input order in the result array. Failures bubble up to
 * the caller so the source can decide whether to abort or skip the item.
 */
async function mapConcurrent(items, concurrency, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const idx = cursor++;
        out[idx] = await fn(items[idx], idx);
      }
    },
  );
  await Promise.all(workers);
  return out;
}

/**
 * Build an axios instance tuned for a specific source.
 *
 * @param {object} opts
 * @param {string} opts.baseURL
 * @param {object} [opts.headers]
 * @param {number} [opts.timeoutMs=30000]
 * @param {number} [opts.minDelayMs=0]   floor between consecutive requests
 * @param {number} [opts.maxRetries=3]
 */
function createClient(opts) {
  const {
    baseURL,
    headers = {},
    timeoutMs = 30000,
    minDelayMs = 0,
    maxRetries = 3,
  } = opts;

  const instance = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: {
      'User-Agent': 'Athlo-ETL/0.1 (skanton3@gmail.com)',
      Accept: 'application/json',
      ...headers,
    },
    httpAgent,
    httpsAgent,
    // Keep the raw error so retry logic can inspect status.
    validateStatus: (s) => s >= 200 && s < 300,
  });

  let nextReadyAt = 0;

  async function request(config) {
    let attempt = 0;
    let lastErr;
    while (attempt <= maxRetries) {
      const now = Date.now();
      if (nextReadyAt > now) await sleep(nextReadyAt - now);

      try {
        const res = await instance.request(config);
        nextReadyAt = Date.now() + minDelayMs;
        return res.data;
      } catch (err) {
        lastErr = err;
        nextReadyAt = Date.now() + minDelayMs;

        const status = err.response?.status;
        const retryable =
          !status || // network error
          status === 408 ||
          status === 429 ||
          (status >= 500 && status < 600);

        if (!retryable || attempt === maxRetries) break;

        // 429 → respect Retry-After if provided, otherwise exponential backoff.
        let backoff;
        const retryAfter = err.response?.headers?.['retry-after'];
        if (status === 429 && retryAfter) {
          const sec = Number(retryAfter);
          backoff = Number.isFinite(sec) ? sec * 1000 : 60000;
        } else {
          backoff = Math.min(30000, 1000 * 2 ** attempt) + Math.random() * 500;
        }
        await sleep(backoff);
        attempt += 1;
      }
    }
    throw lastErr;
  }

  return {
    get: (url, params) => request({ method: 'GET', url, params }),
    instance,
  };
}

module.exports = { createClient, sleep, mapConcurrent };
