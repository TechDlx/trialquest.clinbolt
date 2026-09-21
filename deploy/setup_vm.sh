#!/usr/bin/env bash
#
# One-time (and safely repeatable) bootstrap for quest.clinbolt.com.
#
# Target: Oracle Cloud Always Free, Ubuntu 22.04 or 24.04, either shape
#         (VM.Standard.E2.1.Micro / x86_64 or VM.Standard.A1.Flex / arm64).
#         Designed to share a VM with stats.clinbolt.com: every step checks its
#         own state first, and the Caddy config goes in its own file.
#
# Run it on the VM:
#     git clone https://github.com/TechDlx/trialquest.clinbolt.git ~/quest.clinbolt
#     sudo bash ~/quest.clinbolt/deploy/setup_vm.sh
#
# Every step checks its own state first, so re-running is harmless.
set -euo pipefail

DOMAIN="quest.clinbolt.com"
SITE_ROOT="/var/www/${DOMAIN}"
BUILD_ROOT="/opt/quest-clinbolt"
BUILD_USER="questbot"
NODE_MAJOR=24
NODE_MIN=20
SWAPFILE="/swapfile"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "run this with sudo."

# --------------------------------------------------------------- 1. platform
log "Checking platform"
ARCH="$(dpkg --print-architecture)"
case "$ARCH" in
  amd64)  log "Architecture: amd64 (x86_64 / E2.1.Micro shape)" ;;
  arm64)  log "Architecture: arm64 (Ampere A1 shape)" ;;
  *)      die "unsupported architecture '$ARCH'; expected amd64 or arm64." ;;
esac

if [[ -r /etc/os-release ]]; then
  . /etc/os-release
  log "OS: ${PRETTY_NAME:-unknown}"
  case "${VERSION_ID:-}" in
    22.04|24.04) ;;
    *) warn "tested on Ubuntu 22.04 and 24.04; continuing on ${VERSION_ID:-unknown}." ;;
  esac
fi

# --------------------------------------------------------------- 2. packages
log "Installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  ca-certificates curl gnupg debian-keyring debian-archive-keyring \
  apt-transport-https git rsync iptables-persistent netfilter-persistent

# --------------------------------------------------------------- 3. node
# The site is built on the VM, which needs Node >= 20 (see package.json).
node_major() { node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/'; }
current_node="$(node_major || true)"
if [[ -n "$current_node" ]] && (( current_node >= NODE_MIN )); then
  log "Node already installed: $(node -v)"
else
  log "Adding the NodeSource apt repository (Node ${NODE_MAJOR}.x)"
  # NodeSource publishes both amd64 and arm64 builds.
  install -d -m 755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
  log "Installed Node $(node -v), npm $(npm -v)"
fi

# --------------------------------------------------------------- 4. swap
# tsc + vite peak well above what a 1 GB E2.1.Micro has free next to Caddy and
# the stats refresh job.  A swapfile turns an OOM kill into a slower build.
swap_mb="$(free -m | awk '/^Swap:/ { print $2 }')"
if (( swap_mb >= 1024 )); then
  log "Swap already configured (${swap_mb} MB)"
else
  if [[ ! -f "$SWAPFILE" ]]; then
    log "Creating a 2 GB swapfile at $SWAPFILE"
    fallocate -l 2G "$SWAPFILE" 2>/dev/null \
      || dd if=/dev/zero of="$SWAPFILE" bs=1M count=2048 status=none
    chmod 600 "$SWAPFILE"
    mkswap "$SWAPFILE" >/dev/null
  fi
  if ! swapon --show=NAME --noheadings | grep -qxF "$SWAPFILE"; then
    swapon "$SWAPFILE"
  fi
  if ! grep -q "^${SWAPFILE}[[:space:]]" /etc/fstab; then
    echo "${SWAPFILE} none swap sw 0 0" >> /etc/fstab
  fi
  log "Swap enabled ($(free -m | awk '/^Swap:/ { print $2 }') MB)"
fi

# --------------------------------------------------------------- 5. caddy
if command -v caddy >/dev/null 2>&1; then
  log "Caddy already installed: $(caddy version | head -1)"
else
  log "Adding the official Caddy apt repository"
  # The Cloudsmith repo publishes both amd64 and arm64 builds.
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
  log "Installed $(caddy version | head -1)"
fi

# --------------------------------------------------------------- 6. user/dirs
# npm install runs package lifecycle scripts, so the build runs as an
# unprivileged user rather than root.  Its home is the build directory, which
# also holds the npm cache.
if id -u "$BUILD_USER" >/dev/null 2>&1; then
  log "Build user '$BUILD_USER' already exists"
else
  log "Creating build user '$BUILD_USER' (no login shell)"
  useradd --system --create-home --home-dir "$BUILD_ROOT" \
          --shell /usr/sbin/nologin "$BUILD_USER"
fi

log "Creating directories"
install -d -o "$BUILD_USER" -g "$BUILD_USER" -m 755 "$BUILD_ROOT"
install -d -o "$BUILD_USER" -g "$BUILD_USER" -m 755 "$BUILD_ROOT/src"
install -d -o root -g root -m 755 "$SITE_ROOT"
# Caddy runs as its own user and writes the access log here.
if id -u caddy >/dev/null 2>&1; then
  install -d -o caddy -g caddy -m 755 /var/log/caddy
else
  install -d -m 755 /var/log/caddy
fi

# --------------------------------------------------------------- 7. firewall
# Oracle's Ubuntu images ship an INPUT chain that ends in a REJECT rule, so a
# plain -A ACCEPT lands after it and does nothing.  Insert above the REJECT.
# (Already done if stats.clinbolt.com was set up here; this is then a no-op.)
open_port() {
  local port="$1"
  if iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    log "iptables: port ${port}/tcp already allowed"
    return
  fi
  local reject_line
  reject_line="$(iptables -L INPUT --line-numbers -n \
    | awk '$2 == "REJECT" || $2 == "DROP" { print $1; exit }')"
  if [[ -n "$reject_line" ]]; then
    log "iptables: allowing ${port}/tcp above the REJECT rule at line ${reject_line}"
    iptables -I INPUT "$reject_line" -p tcp --dport "$port" -j ACCEPT
  else
    log "iptables: appending ACCEPT for ${port}/tcp (no REJECT rule found)"
    iptables -A INPUT -p tcp --dport "$port" -j ACCEPT
  fi
}

log "Opening ports 80 and 443 in the instance firewall"
open_port 80
open_port 443
netfilter-persistent save >/dev/null
log "iptables rules persisted"

if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  log "ufw is active; allowing 80 and 443 there too"
  ufw allow 80/tcp  >/dev/null
  ufw allow 443/tcp >/dev/null
fi

# --------------------------------------------------------------- 8. caddy cfg
log "Installing the Caddy site config"
# Other clinbolt sites share this Caddy, so install a snippet under
# /etc/caddy/sites/ rather than overwriting /etc/caddy/Caddyfile.
bash "$SCRIPT_DIR/caddy_site.sh" "$SCRIPT_DIR/quest.caddy" \
  || die "the Caddy config failed validation; not restarting Caddy."
systemctl enable caddy >/dev/null 2>&1 || true

# A reload can fail on a config it has not seen before; fall back to a full
# restart, and report what actually happened instead of assuming it worked.
if systemctl is-active --quiet caddy; then
  systemctl reload caddy >/dev/null 2>&1 || systemctl restart caddy >/dev/null 2>&1 || true
else
  systemctl start caddy >/dev/null 2>&1 || true
fi

if systemctl is-active --quiet caddy; then
  log "Caddy is running"
else
  warn "Caddy is NOT running. Inspect it with:"
  warn "    sudo systemctl status caddy --no-pager"
  warn "    sudo journalctl -xeu caddy -n 50 --no-pager"
fi

# --------------------------------------------------------------- done
cat <<EOF

$(printf '\033[1;32mSetup complete.\033[0m')

  Site root  : ${SITE_ROOT}
  Build dir  : ${BUILD_ROOT}/src
  Build user : ${BUILD_USER}
  Node       : $(node -v)

Next steps:
  1. Build and publish:  sudo bash ${SCRIPT_DIR}/update.sh
  2. Check the site:     curl -I https://${DOMAIN}/

If the site is unreachable, check that DNS for ${DOMAIN} points at this VM
(dig +short ${DOMAIN}) and see DEPLOY.md, "Troubleshooting".
EOF
