#!/bin/bash

# Check for required env vars
: "${KV_NAMESPACE_ID:?Need to set KV_NAMESPACE_ID}"
: "${TRACKING_KV:?Need to set TRACKING_KV}"
: "${WRANGLER_PROJECT_NAME:=tracker}"
: "${MAIN_FILE:=src/index.js}"
: "${COMPAT_DATE:=2025-04-19}"

cat > wrangler.jsonc <<EOF
{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "$WRANGLER_PROJECT_NAME",
  "main": "$MAIN_FILE",
  "compatibility_date": "$COMPAT_DATE",
  "observability": {
    "enabled": true
  },
  "kv_namespaces": [
    {
      "binding": "$TRACKING_KV",
      "id": "$KV_NAMESPACE_ID"
    }
  ]
}
EOF

echo "✅ wrangler.jsonc generated."
