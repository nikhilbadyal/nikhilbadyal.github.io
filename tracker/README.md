# Analytics Tracker Cloudflare Worker

This Cloudflare Worker is a robust, secure, and cost-effective solution for tracking website visits and basic analytics. It is designed to be deployed as a serverless function and is built with security and performance in mind, capable of handling high traffic while minimizing the risk of abuse.

## Features

- **CORS Protection**: Only allows requests from a predefined list of origins.
- **IP-Based Rate Limiting**: Prevents abuse by limiting the number of requests from a single IP address.
- **Deep Data Sanitization**: Actively sanitizes and validates incoming data to prevent malicious payloads and reduce storage costs.
- **Secure Data Handling**: Composes the final tracking entry on the server, preventing client-side data spoofing.
- **Unique Key Generation**: Avoids data loss from concurrent requests by generating a unique key for every visit.
- **Status Endpoint**: A public `/status` endpoint for easy health checks.

## How It Works

1.  The worker receives a `POST` request containing a JSON payload with analytics data.
2.  It validates the request's `Origin` header against a list of allowed domains.
3.  It checks the client's IP address against a rate-limiting rule stored in a KV namespace.
4.  It thoroughly sanitizes the incoming JSON payload, whitelisting only expected fields and truncating their values to prevent abuse.
5.  It enriches the data with server-side information (IP, country, user-agent, timestamp).
6.  It generates a unique key and stores the final, sanitized entry in a `TRACKING_KV` namespace with a 30-day TTL.

## Setup and Deployment

### Prerequisites

- A Cloudflare account.
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and configured.

### 1. Environment Variables & KV Namespaces

This worker requires two KV namespaces to function. Create them using the Wrangler CLI:

```bash
# For storing rate-limiting data (60-second TTL)
npx wrangler kv:namespace create RATE_LIMIT_KV

# For storing tracking visit data (30-day TTL)
npx wrangler kv:namespace create TRACKING_KV
```

After creating the namespaces, add the following to your `wrangler.toml` file, replacing the `id` and `preview_id` values with the output from the commands above.

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your_rate_limit_kv_id"
preview_id = "your_rate_limit_kv_preview_id"

[[kv_namespaces]]
binding = "TRACKING_KV"
id = "your_tracking_kv_id"
preview_id = "your_tracking_kv_preview_id"
```

### 2. Configuration

Open `src/index.js` and configure the following constants:

- `allowedOrigins`: An array of domains that are permitted to send requests to this worker.
- `maxRequestsPerMinute`: The maximum number of requests allowed from a single IP within a 1-minute window.

### 3. Deployment

Deploy the worker to your Cloudflare account:

```bash
npx wrangler deploy
```

## API Reference

### `POST /`

This is the main endpoint for submitting tracking data.

**Request Body (Example)**:
The worker expects a JSON payload. The `sanitizeData` function will only process whitelisted keys.

```json
{
  "sessionId": "unique-session-identifier",
  "title": "Nikhil Badyal - Portfolio",
  "url": "https://www.nikhilbadyal.com/",
  "pathname": "/",
  "referrer": "https://www.google.com/",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
  "screen": {
    "width": 1920,
    "height": 1080,
    "pixelRatio": 2
  }
}
```

### `GET /status`

A public endpoint to verify that the worker is running. Returns a `200 OK` with the text "We are up".

## Error Codes

The worker returns specific error codes in the JSON response body for easier debugging.

| Code       | Status | Description                                                |
|------------|--------|------------------------------------------------------------|
| `XJ4Q8A12` | 403    | The `Origin` header is missing from the request.           |
| `FOB-002`  | 403    | The request `Origin` is not in the `allowedOrigins` list.  |
| `M7DL-403` | 405    | The request method was not `POST` or `OPTIONS`.            |
| `RAT-LMT9` | 429    | The client has exceeded the rate limit.                    |
| `J5N-ERR9` | 400    | The request body could not be parsed as JSON.              |
| `DTX-22B3` | 400    | The submitted data is invalid (e.g., missing `sessionId`). |
| `STR-505E` | 500    | An error occurred while writing to the KV store.           |
| `IP-403`   | 403    | The `cf-connecting-ip` header was not found.               |

