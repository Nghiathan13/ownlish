#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

apt-get update
apt-get install -y docker.io docker-compose-v2 postgresql-client awscli jq
systemctl enable --now docker

install -d -m 0750 -o deploy -g deploy /opt/ownlish
install -d -m 0750 -o deploy -g deploy /opt/ownlish/releases
install -d -m 0700 -o deploy -g deploy /opt/ownlish/env

usermod -aG docker deploy
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
