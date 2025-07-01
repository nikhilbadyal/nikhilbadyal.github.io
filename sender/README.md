# Secure Contact Form Sender

This Cloudflare Worker provides a secure, serverless backend for a website contact form. It receives form submissions, verifies them using Cloudflare Turnstile (a privacy-focused CAPTCHA alternative), and forwards them as a message to a specified Telegram chat. It is designed to be highly resistant to spam and abuse.

## Features

- **CAPTCHA Protection**: Integrates with Cloudflare Turnstile to block automated bots.
- **Strict CORS Control**: Only accepts requests from a whitelist of approved domains.
- **Input Sanitization**: Truncates all user-provided data to prevent oversized payloads and abuse.
- **Output Encoding**: Escapes all user input before sending it to Telegram to prevent injection attacks.
- **Secure Secret Management**: All API keys and secrets are handled securely via environment variables.
- **Easy Integration**: Designed to work with any standard HTML form and a simple JSON fetch request.

## How It Works

1.  A user submits the contact form on your website.
2.  The frontend JavaScript sends a `POST` request to this worker with the form data and a Turnstile token.
3.  The worker validates the request's `Origin` header.
4.  It sends the Turnstile token to Cloudflare's `siteverify` endpoint to confirm the user is human.
5.  It sanitizes and truncates all form fields (`name`, `email`, `message`).
6.  It escapes the sanitized fields to be safe for Telegram's Markdown format.
7.  It sends the final, formatted message to your Telegram chat via the Telegram Bot API.

## Setup and Deployment

### Prerequisites

- A Cloudflare account.
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and configured.
- A **Telegram Bot** and its **Token**. [Learn how to create one](https://core.telegram.org/bots#creating-a-new-bot).
- Your **Telegram Chat ID**. [Learn how to find it](https://docs.influxdata.com/kapacitor/v1.5/event_handlers/telegram/#finding-your-telegram-chat-id).
- (Optional) A **Telegram Thread ID** if you want to send messages to a specific topic in a group.

### 1. Cloudflare Turnstile Setup

1.  Go to your Cloudflare Dashboard.
2.  Navigate to **Turnstile** and create a new site.
3.  Note the **Site Key** (for your frontend) and the **Secret Key** (for this worker).

### 2. Environment Variables

This worker relies on secrets stored in environment variables. Use the Wrangler CLI to set them:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put TELEGRAM_THREAD_ID
```

### 3. Configuration

Open `src/index.js` and configure the `allowedOrigins` constant with the domains where your contact form is hosted.

### 4. Deployment

Deploy the worker to your Cloudflare account:

```bash
npx wrangler deploy
```

## API Reference

### `POST /`

This is the main endpoint for submitting form data.

**Request Body (Example)**:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "message": "Hello, I would like to get in touch!",
  "token": "<CLOUDFLARE_TURNSTILE_TOKEN>"
}
```

### `GET /status`

A public endpoint to verify that the worker is running. Returns a `200 OK` with the text "We are up".

## Error Codes

The worker returns specific error codes in the JSON response body for easier debugging.

| Code       | Status | Description                                               |
|------------|--------|-----------------------------------------------------------|
| `J5N-ERR9` | 400    | The request body could not be parsed as JSON.             |
| `TK9-MSSN` | 400    | The Turnstile `token` is missing from the request.        |
| `CAP-403D` | 403    | Turnstile verification failed (likely a bot).             |
| `TEL-519C` | 500    | The worker failed to send the message via Telegram.       |
| `ORI-003F` | 403    | The request `Origin` is not in the `allowedOrigins` list. |
| `NF-404Q`  | 404    | The requested endpoint was not found.                     |
| `EML-22X`  | 400    | The provided email address has an invalid format.         |
