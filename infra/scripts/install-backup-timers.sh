#!/usr/bin/env bash
set -euo pipefail

root="/opt/ownlish/current/production"
test -f /opt/ownlish/env/production.env
test -f /opt/ownlish/env/production-backup.env

install -m 0644 "$root/infra/systemd/ownlish-backup-daily.service" /etc/systemd/system/ownlish-backup-daily.service
install -m 0644 "$root/infra/systemd/ownlish-backup-daily.timer" /etc/systemd/system/ownlish-backup-daily.timer
install -m 0644 "$root/infra/systemd/ownlish-backup-weekly.service" /etc/systemd/system/ownlish-backup-weekly.service
install -m 0644 "$root/infra/systemd/ownlish-backup-weekly.timer" /etc/systemd/system/ownlish-backup-weekly.timer

systemctl daemon-reload
systemctl enable --now ownlish-backup-daily.timer ownlish-backup-weekly.timer
