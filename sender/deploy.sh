#!/bin/bash

# Check for required env vars
: "${WORKER_NAME:?Need to set WORKER_NAME}"
: "${TELEGRAM_CHAT_ID:?Need to set TELEGRAM_CHAT_ID}"
: "${TELEGRAM_BOT_TOKEN:?Need to set TELEGRAM_BOT_TOKEN}"
: "${MAIN_FILE:=src/index.js}"


# Check for wrangler first
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found. Please install it with 'pnpm install -g wrangler'"
    exit 1
fi


cat > wrangler.jsonc <<EOF
{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "$WORKER_NAME",
  "main": "$MAIN_FILE",
  "compatibility_date": "2025-03-13",
  "observability": {
    "enabled": true
  }
}
EOF

echo "✅ wrangler.jsonc generated."

# Add verification step
echo "Verifying wrangler.jsonc update..."
# Use grep -E to match the line containing the name, allowing for whitespace and no trailing comma
MATCHED_LINE=$(grep -E "^\s*\"name\": \"$WORKER_NAME\"" wrangler.jsonc || echo "GREP_FAILED")
if [[ "$MATCHED_LINE" == "GREP_FAILED" ]]; then
    echo "Error: Failed to verify update of 'name' in wrangler.jsonc!"
    echo "Expected name: $WORKER_NAME"
    echo "Current content of wrangler.jsonc:"
    cat wrangler.jsonc
    exit 1
fi
echo "Verification successful. Matched line: $MATCHED_LINE"


echo "=====Deploying Worker ====="
echo "Deploying Worker '$WORKER_NAME'..."
# Deploy using the updated wrangler.jsonc and capture output
DEPLOY_OUTPUT=$(wrangler deploy)
echo "$DEPLOY_OUTPUT" # Show deployment output

echo "===== Deployment Complete ====="
echo "Your Worker '$WORKER_NAME' is now deployed!"

# Get the worker URL from the captured deploy output
echo "Retrieving deployment details from output..."
# Try to parse the URL from the captured output
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.workers\.dev')

if [[ -z "$WORKER_URL" ]]; then
    # Fallback if parsing failed - construct based on worker name
    WORKER_URL="https://$WORKER_NAME.$DOMAIN.workers.dev"
    echo "Could not automatically determine worker URL. It should be available at approximately:"
    echo "$WORKER_URL"
else
     echo "You can access it at: $WORKER_URL"
fi

echo "===== Verifying Deployment ====="
echo "Attempting to fetch status from deployed worker..."
# Add a short delay to allow deployment to propagate
sleep 5
if curl -sf "$WORKER_URL/status" > /dev/null; then
    echo "✅ Deployment verified successfully! Worker is responding at $WORKER_URL/status"
else
    echo "⚠️ Warning: Could not automatically verify worker status at $WORKER_URL/status."
    echo "   Deployment might still be in progress, or there might be an issue."
    echo "   Please check the Cloudflare dashboard and try accessing the URL manually."
fi
