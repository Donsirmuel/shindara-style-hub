#!/usr/bin/env bash
# Nightly backup for the $3 VPS: database + uploads into one dated tarball.
# Install: copy to /opt/shindara/backup.sh, then:
#   crontab -e   →   0 2 * * * /opt/shindara/backup.sh >> /var/log/shindara-backup.log 2>&1
# Restore: tar -xzf shindara-backup-YYYYMMDD.tar.gz -C /  (from the app dir's parent)
#   then restart: docker compose up -d   (or: npm start)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/shindara/app}"
BACKUP_DIR="${BACKUP_DIR:-/opt/shindara/backups}"
KEEP="${KEEP_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d)"
ARCHIVE="$BACKUP_DIR/shindara-backup-$STAMP.tar.gz"

tar -czf "$ARCHIVE" -C "$APP_DIR" data uploads .env 2>/dev/null || \
  tar -czf "$ARCHIVE" -C "$APP_DIR" data uploads

# Real-Postgres mode: also dump the database (needs pg client on host or use the db container)
if grep -q "^DATABASE_URL=postgres" "$APP_DIR/.env" 2>/dev/null; then
  # shellcheck disable=SC1091
  set -a; source <(grep "^DATABASE_URL=" "$APP_DIR/.env"); set +a
  pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/shindara-db-$STAMP.sql.gz" || \
    echo "WARN: pg_dump failed — volume backup above still holds the data dir"
fi

find "$BACKUP_DIR" -name "shindara-*" -mtime +"$KEEP" -delete
echo "$(date -Is) backup OK: $ARCHIVE"
