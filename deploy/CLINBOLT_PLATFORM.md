# ClinBolt hosting platform — deployment reference

**Scope.** Every clinbolt.com site (apex, subdomain, or a folder under the apex) runs on one
small Oracle Cloud VM behind one Caddy. This file describes that platform and the deployment
convention each repo follows, so a new repo can be deployed the same way.

Written from `trialquest.clinbolt` (quest.clinbolt.com) on 2026-09-23. Copy this file into any
clinbolt repo. The scripts it describes live in `deploy/` of an existing site repo
(`trialquest.clinbolt` or `stats.clinbolt`); copy them from there rather than writing new ones.

> **For an agent working in another repo:** read "Conventions", then "Adding a new site". Do not
> invent a different layout: several sites share this VM and its Caddy, and one careless deploy
> takes the others offline. Deploy only when the user asks; running `update.sh` publishes to the
> live internet.

---

## 1. The platform

| Piece      | What it is                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Host       | One Oracle Cloud "Always Free" VM, Ubuntu 22.04/24.04, amd64 (E2.1.Micro) or arm64 (Ampere A1). ~1 GB RAM on the Micro shape. |
| Web server | Caddy (apt package, Cloudsmith repo). Gets and renews Let's Encrypt certificates by itself.                                   |
| Sites      | Several, all on this one VM and one Caddy. Known: `stats.clinbolt.com`, `quest.clinbolt.com`.                                 |
| Build      | On the VM. Node (NodeSource apt, ≥ 20; 24 installed by default). No CI/CD, no containers, no registry.                        |
| Access     | `ssh clinbolt` (an SSH config alias on the user's machine). Everything is run with `sudo bash …`.                             |
| DNS        | An `A` record per hostname pointing at the VM's public IP. All existing hostnames share one IP.                               |

**Consequences worth knowing before designing anything:**

- **Memory is the scarce resource.** `tsc` + a bundler can be OOM-killed on the Micro shape. The
  bootstrap script adds a 2 GB swapfile. Don't run two builds at once, or a build alongside a
  heavy scheduled job on the VM.
- **No secrets are stored in these repos.** Nothing in `deploy/` reads an API key. If a site needs
  one, ask the user where it should live (systemd `EnvironmentFile` outside the repo is the pattern
  to propose); never commit it.
- **A deploy is a publish.** There is no staging site. Build and test locally first.

---

## 2. Conventions

Given a site name (the `<name>` in `<name>.clinbolt.com`, or a short slug for a folder site):

| Thing               | Pattern                                                                                                     | Example (`quest`)                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Repo on the VM      | `~/<repo-dir>`                                                                                              | `~/quest.clinbolt`                      |
| Build copy          | `/opt/<slug>/src`                                                                                           | `/opt/quest-clinbolt/src`               |
| Build user          | `<name>bot`, system user, no login shell, home = build dir                                                  | `questbot`                              |
| Served files        | `/var/www/<domain>`                                                                                         | `/var/www/quest.clinbolt.com`           |
| Caddy site file     | `/etc/caddy/sites/<name>.caddy`                                                                             | `/etc/caddy/sites/quest.caddy`          |
| Access log          | `/var/log/caddy/<domain>.log`                                                                               | `/var/log/caddy/quest.clinbolt.com.log` |
| Scripts in the repo | `deploy/setup_vm.sh`, `deploy/update.sh`, `deploy/caddy_site.sh`, `deploy/<name>.caddy`, `deploy/DEPLOY.md` |                                         |

Each repo owns **exactly one** file in `/etc/caddy/sites/`. It owns nothing else on the VM outside
its own three directories.

### The shared Caddy layout

`/etc/caddy/Caddyfile` contains only:

```
# Managed by the clinbolt deploy scripts (deploy/caddy_site.sh).
# Each site's config lives in its own file under /etc/caddy/sites/.
import /etc/caddy/sites/*.caddy
```

`deploy/caddy_site.sh` installs one site file, validates the **combined** config, and restores the
previous files and exits non-zero if validation fails, so a bad config never reaches a running
Caddy. It is byte-identical in every clinbolt repo — **keep the copies identical**; improve it in
one repo and copy it to the others.

Two behaviours to know:

- **Conversion.** If `/etc/caddy/Caddyfile` is still an old single-site file, the script replaces it
  with the import line and keeps a copy as `Caddyfile.pre-sites.<timestamp>` — but only if every
  address it serves belongs to the site being installed. If it serves another site, it refuses, and
  that site's repo must run its own `update.sh` first. This is deliberate: converting would take
  the other site offline.
- **Log ownership.** `caddy validate` runs as root and creates any new log file as `root:root 0600`,
  which the `caddy` service user then cannot open, so Caddy fails to start **for every site**. The
  script therefore `chown -R caddy:caddy /var/log/caddy` after each validation. Keep that.

---

## 3. The three scripts

All are idempotent: safe to re-run, every step checks its own state first. Keep them that way.

### `deploy/setup_vm.sh` — once per site (harmless to repeat)

Checks architecture and OS; installs base packages; installs Node if < 20; adds a 2 GB swapfile if
swap < 1 GB; installs Caddy if missing; creates the build user and the three directories; opens
ports 80/443; installs the site's Caddy file and starts Caddy.

**The firewall step matters on Oracle images:** their `INPUT` chain ends in a `REJECT`, so an
appended `ACCEPT` never matches. The script inserts the rule _above_ the REJECT and persists it
with `netfilter-persistent`. Oracle's cloud-level security list must also allow 80/443; that is
done in the Oracle console, not on the VM.

### `deploy/update.sh` — every deploy

1. `--pull` (optional) pulls the repo as the invoking user (`git` refuses repos owned by others).
2. `rsync` the checkout to `/opt/<slug>/src`, excluding `.git/`, `node_modules/`, `dist/`, test
   output and `*.tsbuildinfo`, then `chown` to the build user.
3. `npm ci` **only** when `node -v` + the hash of `package-lock.json` differ from the stamp in
   `node_modules/.deploy-deps-key`. This is what keeps a redeploy to a couple of minutes.
4. Build as the build user. For a Vite site at a domain root: `VITE_BASE=/ npm run build`.
5. Abort if `dist/index.html` is missing — **a failed build must leave the live site untouched.**
6. `rsync --delete-after --delay-updates` `dist/` into `/var/www/<domain>`, then fix ownership and
   modes (dirs 755, files 644). The flags keep old hashed assets alive until the new set is fully
   in place, so a page loaded mid-publish still works.
7. Re-install the Caddy file and `systemctl reload-or-restart caddy` (reload alone does not start a
   stopped Caddy).

### `deploy/caddy_site.sh` — called by both

Described above. Never call `systemctl` from it; the caller decides.

---

## 4. The Caddy site file

### A static site on its own subdomain (the common case)

```caddy
<name>.clinbolt.com {
	root * /var/www/<name>.clinbolt.com
	encode zstd gzip

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		X-Frame-Options "SAMEORIGIN"
		Permissions-Policy "geolocation=(), microphone=(), camera=(), interest-cohort=()"
		Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
		-Server
	}

	# Content-hashed bundles never change; everything else must revalidate or
	# installed PWAs keep running an old build.
	@immutable path /assets/*
	header @immutable Cache-Control "public, max-age=31536000, immutable"
	@revalidate not path /assets/*
	header @revalidate Cache-Control "public, max-age=0, must-revalidate"

	handle /assets/* {
		file_server
	}
	handle {
		try_files {path} /index.html        # SPA fallback; omit for a multi-page site
		file_server
	}

	handle_errors {
		header Cache-Control "no-store"
		respond "{err.status_code} {err.status_text}"
	}

	log {
		output file /var/log/caddy/<name>.clinbolt.com.log {
			roll_size 10mb
			roll_keep 5
		}
		format console
	}
}
```

**CSP is strict by default and will block anything third-party.** Add only what the site actually
uses, and verify in a browser rather than assuming. Two traps seen in practice:

- An **inline** `<script>` needs `'sha256-…'` of its exact text in `script-src` (byte-exact,
  LF line endings, as built). A test that recomputes the hash from the built HTML and compares it
  with the Caddy file is worth the 20 lines; without it the tag silently dies on the next edit.
- **Google Analytics (GA4)** needs `script-src https://*.googletagmanager.com`,
  `connect-src https://*.google-analytics.com https://*.analytics.google.com
https://*.googletagmanager.com https://*.g.doubleclick.net https://*.google.com`, and the last
  two plus `*.google-analytics.com` in `img-src`. The `www.google.com/g/collect` endpoint is easy
  to miss because it only appears at runtime.

### A folder under the apex domain (`clinbolt.com/<path>/`)

Use this when the user wants `clinbolt.com/thing` rather than `thing.clinbolt.com`.

**Who owns the block:** the apex `clinbolt.com { … }` block lives in exactly one repo's site file —
whichever repo owns the apex site. A sub-path app cannot add its own top-level block for the same
hostname: Caddy's config adapter rejects a duplicate site address, so the whole config fails to
validate and `caddy_site.sh` rolls back. So either:

- **(a)** the apex repo adds the `handle_path` block below and deploys it, or
- **(b)** the apex site file is moved into a shared location both repos install (needs the user's
  decision).

Ask the user which repo owns the apex before writing anything.

```caddy
clinbolt.com {
	# … the apex site's own root / handlers …

	handle_path /<path>/* {
		root * /var/www/clinbolt.com-<path>
		encode zstd gzip
		@immutable path /assets/*
		header @immutable Cache-Control "public, max-age=31536000, immutable"
		@revalidate not path /assets/*
		header @revalidate Cache-Control "public, max-age=0, must-revalidate"
		try_files {path} /index.html
		file_server
	}
}
```

`handle_path` strips the prefix before `root` is applied. The app must also be **built** for that
prefix, or every asset URL 404s:

- Vite: `VITE_BASE=/<path>/ npm run build` (the `update.sh` build step changes accordingly).
- A hash router keeps working; a history router needs its own basename set to `/<path>`.
- A PWA needs `scope` and `start_url` of `/<path>/`, and the service worker is only allowed to
  control that sub-path.
- Headers set in the apex block apply to the sub-path too, so the apex CSP must cover this app's
  needs as well. This coupling is the main reason to prefer a subdomain.

### Something that is not a static site

For an app that listens on a port (Node, Python, whatever), replace `root`/`file_server` with:

```caddy
<name>.clinbolt.com {
	encode zstd gzip
	header { … same security headers … }
	reverse_proxy 127.0.0.1:<port>
	log { output file /var/log/caddy/<name>.clinbolt.com.log }
}
```

The process itself needs a systemd unit running as the site's own unprivileged user, bound to
**127.0.0.1** only (never 0.0.0.0: the VM firewall opens 80/443 only), plus
`systemctl enable --now <name>`. Put the unit in `deploy/` and install it from `setup_vm.sh`,
matching the style of the existing scripts. Ask the user before adding a long-running service:
it competes for the VM's ~1 GB of RAM with everything else.

---

## 5. Adding a new site

1. **Copy `deploy/` from an existing site repo.** Change only the constants at the top of
   `setup_vm.sh` and `update.sh` (`DOMAIN`, `SITE_ROOT`, `BUILD_ROOT`, `BUILD_USER`), rename
   `<name>.caddy` and edit the domain inside it. Leave `caddy_site.sh` byte-identical.
2. **Write `deploy/DEPLOY.md`** for that repo: the table of paths, first-deploy steps, update
   command, checks, troubleshooting. Keep it short; this file holds the shared background.
3. **DNS.** The user adds an `A` record `<name>` → the VM's public IP. Confirm with
   `dig +short <name>.clinbolt.com` before deploying, or Caddy's certificate request fails and
   backs off.
4. **On the VM:**
   ```bash
   ssh clinbolt
   git clone https://github.com/TechDlx/<repo>.git ~/<repo-dir>
   sudo bash ~/<repo-dir>/deploy/setup_vm.sh
   sudo bash ~/<repo-dir>/deploy/update.sh
   ```
5. **Check** (see below). Then hand the user the update command:
   `sudo bash ~/<repo-dir>/deploy/update.sh --pull`.

---

## 6. Checking a deploy

```bash
curl -I https://<name>.clinbolt.com/          # 200, security headers, cache headers
curl -I https://<other-site>.clinbolt.com/    # the neighbours still work
ls /etc/caddy/sites/                          # one file per site
sudo systemctl status caddy --no-pager
sudo tail -f /var/log/caddy/<name>.clinbolt.com.log
```

In a browser: no CSP errors in the console; for a PWA, Application → Service workers shows
`sw.js` activated. Remember installed PWAs only pick up a new build on their next visit.

## 7. Troubleshooting

| Symptom                                          | Cause and fix                                                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| No certificate, or connection refused            | DNS first (`dig +short`). If a sibling site serves HTTPS, ports are not the cause. Then `sudo journalctl -u caddy -n 50 --no-pager`.        |
| Build killed / exit 137                          | Out of memory. `free -m` should show the swapfile; don't build during another site's heavy job.                                             |
| `caddy_site.sh` refuses to convert the Caddyfile | Another site is still in the old single-file layout. Run that site's `update.sh` first.                                                     |
| Caddy won't start after adding a site            | Usually the log-file ownership trap (§2). `sudo chown -R caddy:caddy /var/log/caddy`, then `sudo systemctl restart caddy`.                  |
| Site serves an old build                         | Cache headers: `/assets/*` immutable, everything else `max-age=0, must-revalidate`. Check with `curl -I`.                                   |
| One site's deploy broke another                  | Should be impossible: a repo may only write its own `sites/*.caddy`. If a repo writes `/etc/caddy/Caddyfile` directly, fix that repo.       |
| Roll back                                        | `git -C ~/<repo-dir> checkout <good-commit> && sudo bash ~/<repo-dir>/deploy/update.sh`, then `git checkout main` before the next `--pull`. |

## 8. Rules for an agent working on any of this

- Deploy only when asked. `update.sh` publishes to the live internet.
- Never write `/etc/caddy/Caddyfile` from a site repo. One file under `/etc/caddy/sites/`, no more.
- Never touch another site's directories, log files, systemd units or build user.
- Keep every script idempotent and keep `caddy_site.sh` identical across repos.
- Don't add a scheduled job, a daemon or a database without asking: this VM is small and shared.
- No secrets in the repo.
- Build and test locally before deploying; a build that fails on the VM leaves the old site up, but
  a build that _succeeds_ and is broken does not.

## 9. Confirm with the user before a first deploy

These are per-environment facts this document deliberately does not hard-code: the VM's public IP
and SSH alias, which repo owns the apex `clinbolt.com` block, whether the new hostname's DNS record
exists yet, and whether the site needs anything the strict CSP would block (analytics, fonts,
embeds, an API on another origin).
