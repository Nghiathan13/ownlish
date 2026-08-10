#!/usr/bin/env bash
set -euo pipefail

kind="${1:?usage: backup-postgres.sh <daily|weekly>}"
case "$kind" in
  daily|weekly) ;;
  *) echo "backup type must be daily or weekly" >&2; exit 1 ;;
esac

root="/opt/ownlish/current/production"
env_file="/opt/ownlish/env/production.env"
backup_env_file="/opt/ownlish/env/production-backup.env"
compose_file="$root/infra/compose/app.compose.yml"
project="ownlish-production"

set -a
source "$env_file"
source "$backup_env_file"
set +a

: "${R2_ENDPOINT:?R2_ENDPOINT is required}"
: "${R2_BACKUPS_BUCKET:?R2_BACKUPS_BUCKET is required}"
: "${R2_BACKUP_ACCESS_KEY_ID:?R2_BACKUP_ACCESS_KEY_ID is required}"
: "${R2_BACKUP_SECRET_ACCESS_KEY:?R2_BACKUP_SECRET_ACCESS_KEY is required}"

temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
filename="ownlish-postgres-${timestamp}.dump"
dump_path="$temporary_directory/$filename"

env "OWNLISH_ENV_FILE=$env_file" docker compose --project-name "$project" --env-file "$env_file" -f "$compose_file" \
  exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --format=custom --no-owner --no-privileges > "$dump_path"

AWS_ACCESS_KEY_ID="$R2_BACKUP_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_BACKUP_SECRET_ACCESS_KEY" \
AWS_DEFAULT_REGION=auto \
  aws --endpoint-url "$R2_ENDPOINT" s3 cp "$dump_path" "s3://$R2_BACKUPS_BUCKET/$kind/$filename"

keep=14
if [ "$kind" = "weekly" ]; then
  keep=8
fi

mapfile -t old_files < <(
  AWS_ACCESS_KEY_ID="$R2_BACKUP_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_BACKUP_SECRET_ACCESS_KEY" \
  AWS_DEFAULT_REGION=auto \
    aws --endpoint-url "$R2_ENDPOINT" s3 ls "s3://$R2_BACKUPS_BUCKET/$kind/" \
    | sort -r | awk -v keep="$keep" 'NR > keep { print $4 }'
)

for old_file in "${old_files[@]}"; do
  AWS_ACCESS_KEY_ID="$R2_BACKUP_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_BACKUP_SECRET_ACCESS_KEY" \
  AWS_DEFAULT_REGION=auto \
    aws --endpoint-url "$R2_ENDPOINT" s3 rm "s3://$R2_BACKUPS_BUCKET/$kind/$old_file"
done
