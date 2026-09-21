#!/usr/bin/env bash
#
# Install one site's Caddy block next to the other clinbolt sites on this VM.
#
#     sudo bash deploy/caddy_site.sh deploy/<site>.caddy
#
# Several clinbolt sites share one Caddy.  /etc/caddy/Caddyfile only imports
# /etc/caddy/sites/*.caddy and each repo owns exactly one file in there, so
# deploying one site can never overwrite another site's config.  The same script
# lives in every clinbolt repo's deploy/ folder; keep the copies identical.
#
# This installs and validates but does not reload Caddy; the caller does that.
# If the result does not validate, the previous files are put back and the
# script exits non-zero, so a running Caddy keeps its current config.
set -euo pipefail

SITE_FILE="${1:-}"
CADDY_MAIN="/etc/caddy/Caddyfile"
CADDY_SITES="/etc/caddy/sites"
IMPORT_LINE="import ${CADDY_SITES}/*.caddy"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run this with sudo."
[[ -n "$SITE_FILE" && -f "$SITE_FILE" ]] || die "usage: caddy_site.sh <path/to/site>.caddy"
command -v caddy >/dev/null 2>&1 || die "caddy is not installed; run setup_vm.sh first."

# Top-level site addresses in a Caddyfile, one per line.  Skips comments, the
# global options block ("{" alone) and snippet definitions ("(name) {").
site_addresses() {
  awk '/^[^#[:space:]({][^{]*\{[[:space:]]*$/ {
         sub(/[[:space:]]*\{[[:space:]]*$/, "")
         gsub(/,/, " ")
         for (i = 1; i <= NF; i++) print $i
       }' "$1"
}

name="$(basename "$SITE_FILE")"
target="${CADDY_SITES}/${name}"
backup_dir="$(mktemp -d /tmp/caddy-site-backup.XXXXXX)"
trap 'rm -rf "$backup_dir"' EXIT

install -d -o root -g root -m 755 "$CADDY_SITES"
if [[ -f "$CADDY_MAIN" ]]; then cp -p "$CADDY_MAIN" "$backup_dir/Caddyfile"; fi
if [[ -f "$target" ]]; then cp -p "$target" "$backup_dir/$name"; fi

# --------------------------------------------------------- main Caddyfile
# Either it already imports the sites directory, or it is the apt default or
# an old single-site Caddyfile.  Replace it only when every site it serves is
# the one being installed now (or the apt default ":80" placeholder).  If it
# serves some other site, that site's repo must move to a snippet first, or
# this deploy would take it offline.
if ! grep -qxF "$IMPORT_LINE" "$CADDY_MAIN" 2>/dev/null; then
  if [[ -f "$CADDY_MAIN" ]]; then
    ours="$(site_addresses "$SITE_FILE")"
    while read -r addr; do
      [[ -z "$addr" || "$addr" == ":80" ]] && continue
      if ! grep -qxF "$addr" <<<"$ours"; then
        die "$CADDY_MAIN still serves '$addr' directly. Run that site's
       deploy/update.sh first so it moves into ${CADDY_SITES}/, then re-run this."
      fi
    done < <(site_addresses "$CADDY_MAIN")

    keep="${CADDY_MAIN}.pre-sites.$(date +%Y%m%d%H%M%S)"
    cp -p "$CADDY_MAIN" "$keep"
    log "Saved the previous Caddyfile as $keep"
  fi
  cat > "$CADDY_MAIN" <<EOF
# Managed by the clinbolt deploy scripts (deploy/caddy_site.sh).
# Each site's config lives in its own file under ${CADDY_SITES}/.
${IMPORT_LINE}
EOF
  chmod 644 "$CADDY_MAIN"
  log "$CADDY_MAIN now imports ${CADDY_SITES}/*.caddy"
fi

# --------------------------------------------------------- site file
install -o root -g root -m 644 "$SITE_FILE" "$target"
log "Installed $target"

if caddy validate --config "$CADDY_MAIN" --adapter caddyfile >/dev/null 2>&1; then
  log "Caddy config validates"
else
  warn "the Caddy config does not validate:"
  caddy validate --config "$CADDY_MAIN" --adapter caddyfile 2>&1 | tail -5 >&2 || true
  warn "restoring the previous files."
  if [[ -f "$backup_dir/Caddyfile" ]]; then cp -p "$backup_dir/Caddyfile" "$CADDY_MAIN"; fi
  if [[ -f "$backup_dir/$name" ]]; then
    cp -p "$backup_dir/$name" "$target"
  else
    rm -f "$target"
  fi
  exit 1
fi
