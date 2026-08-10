#!/usr/bin/env bash
set -euo pipefail

environment="${1:?usage: deploy.sh <staging|production> <release-id>}"
release_id="${2:?usage: deploy.sh <staging|production> <release-id>}"

case "$environment" in
  staging|production) ;;
  *) echo "environment must be staging or production" >&2; exit 1 ;;
esac

root="/opt/ownlish/releases/${release_id}"
env_file="/opt/ownlish/env/${environment}.env"
compose_file="$root/infra/compose/app.compose.yml"
project="ownlish-${environment}"

test -d "$root"
test -f "$env_file"

sudo install -d -m 0750 -o deploy -g deploy /opt/ownlish/current
sudo ln -sfn "$root" "/opt/ownlish/current/${environment}"
sudo ln -sfn "$root" "/opt/ownlish/current/edge"
sudo docker network inspect ownlish-edge >/dev/null 2>&1 || sudo docker network create ownlish-edge

edge_compose="/opt/ownlish/current/edge/infra/compose/edge.compose.yml"
sudo docker compose -f "$edge_compose" up -d --force-recreate

compose=(sudo env "OWNLISH_ENV_FILE=$env_file" docker compose --project-name "$project" --env-file "$env_file" -f "$compose_file")
"${compose[@]}" up -d postgres
"${compose[@]}" run --rm server pnpm migrate:deploy
"${compose[@]}" up -d --build --remove-orphans server web

for attempt in $(seq 1 30); do
  if "${compose[@]}" exec -T server node -e "fetch('http://127.0.0.1:3001/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"; then
    echo "${environment} deployment ${release_id} is healthy"
    exit 0
  fi
  sleep 2
done

echo "${environment} deployment ${release_id} did not become healthy" >&2
exit 1
