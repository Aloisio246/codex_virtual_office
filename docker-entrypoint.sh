#!/bin/sh
set -eu
mkdir -p /root/.codex
cat > /root/.codex/config.toml <<'EOF'
[mcp_servers.openaiDeveloperDocs]
url = "https://developers.openai.com/mcp"
EOF
if [ -f /run/codex-auth.json ]; then
  cp /run/codex-auth.json /root/.codex/auth.json
  chmod 600 /root/.codex/auth.json
fi
exec "$@"
