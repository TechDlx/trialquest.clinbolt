#!/usr/bin/env bash
#
# Build the current git checkout and publish it.  Runs ON THE VM.
#
#     git -C ~/quest.clinbolt pull
#     sudo bash ~/quest.clinbolt/deploy/update.sh
#
# or, pulling first as the invoking user:
#
#     sudo bash ~/quest.clinbolt/deploy/update.sh --pull
#
# The checkout is copied to /opt/quest-clinbolt/src and built there as the
# unprivileged build user; only the finished dist/ reaches the site root.
set -euo pipefail

DOMAIN="quest.clinbolt.com"
SITE_ROOT="/var/www/${DOMAIN}"
BUILD_ROOT="/opt/quest-clinbolt"
BUILD_USER="questbot"
SRC_DIR="${BUILD_ROOT}/src"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_USER="${SUDO_USER:-ubuntu}"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run this with sudo."
[[ -f "$REPO_ROOT/package.json" && -d "$REPO_ROOT/src" ]] \
  || die "$REPO_ROOT does not look like the repository (no package.json and src/)."
[[ -d "$SRC_DIR" ]] && id -u "$BUILD_USER" >/dev/null 2>&1 \
  || die "$SRC_DIR or user $BUILD_USER is missing; run setup_vm.sh first."
command -v node >/dev/null 2>&1 || die "node is not installed; run setup_vm.sh first."

# git refuses to operate on a repo owned by another user, so run it as the
# person who invoked sudo rather than as root.
as_repo_user() { sudo -u "$REPO_USER" "$@"; }
as_build_user() { sudo -u "$BUILD_USER" -H "$@"; }

# --------------------------------------------------------------- 1. pull
if [[ "${1:-}" == "--pull" ]]; then
  log "Pulling latest changes as ${REPO_USER}"
  as_repo_user git -C "$REPO_ROOT" pull --ff-only
fi

log "Building from $REPO_ROOT"
as_repo_user git -C "$REPO_ROOT" log -1 --format='    commit %h  %s  (%ci)' 2>/dev/null || true

# --------------------------------------------------------------- 2. stage
# node_modules/ and dist/ are excluded, so --delete leaves them in place and
# the next build reuses the installed packages.
log "Staging source in $SRC_DIR"
rsync -a --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude 'dev-dist/' \
  --exclude 'test-results/' \
  --exclude 'playwright-report/' \
  --exclude 'coverage/' \
  --exclude '*.tsbuildinfo' \
  "$REPO_ROOT/" "$SRC_DIR/"
chown -R "${BUILD_USER}:${BUILD_USER}" "$SRC_DIR"
cd "$SRC_DIR"

# --------------------------------------------------------------- 3. deps
# npm ci wipes and reinstalls node_modules, which takes a while on a small VM,
# so skip it when neither the lockfile nor the Node version has changed.
deps_key="$(node -v) $(sha256sum package-lock.json | cut -d' ' -f1)"
deps_stamp="$SRC_DIR/node_modules/.deploy-deps-key"
if [[ -f "$deps_stamp" && "$(cat "$deps_stamp")" == "$deps_key" ]]; then
  log "Dependencies unchanged; skipping npm ci"
else
  log "Installing dependencies (npm ci)"
  as_build_user npm ci --no-audit --no-fund --loglevel=error
  as_build_user sh -c "printf '%s' '$deps_key' > '$deps_stamp'"
fi

# --------------------------------------------------------------- 4. build
# VITE_BASE=/ gives absolute asset URLs; the site is served from the domain root.
log "Building (tsc + vite)"
as_build_user env VITE_BASE=/ npm run build
[[ -f "$SRC_DIR/dist/index.html" ]] || die "the build produced no dist/index.html; the site was not touched."

# --------------------------------------------------------------- 5. publish
# --delay-updates and --delete-after keep old hashed assets around until the
# new files are all in place, so a page loaded mid-publish still works.
log "Publishing dist/ to $SITE_ROOT"
rsync -a --delete-after --delay-updates --no-owner --no-group \
  "$SRC_DIR/dist/" "$SITE_ROOT/"
chown -R root:root "$SITE_ROOT"
find "$SITE_ROOT" -type d -exec chmod 755 {} +
find "$SITE_ROOT" -type f -exec chmod 644 {} +

# --------------------------------------------------------------- 6. caddy
log "Updating the Caddy configuration"
if bash "$REPO_ROOT/deploy/caddy_site.sh" "$REPO_ROOT/deploy/quest.caddy"; then
  # reload-or-restart also starts Caddy if it is down.
  systemctl reload-or-restart caddy
  log "Caddy reloaded"
else
  warn "the Caddy config did not validate; Caddy was left running the old config."
fi

# --------------------------------------------------------------- done
log "Done. $(du -sh "$SITE_ROOT" | cut -f1) published to $SITE_ROOT"
cat <<EOF

  Site  : https://${DOMAIN}/
  Check : curl -I https://${DOMAIN}/
EOF
