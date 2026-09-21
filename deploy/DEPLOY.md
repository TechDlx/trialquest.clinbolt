# Deploying quest.clinbolt.com

Trial Quest is a static PWA. It runs on the same Oracle Cloud VM as
stats.clinbolt.com, behind the same Caddy. The VM keeps a git clone, builds
it with Node, and Caddy serves `dist/` from `/var/www/quest.clinbolt.com`.
Nothing runs on a schedule, so there is no refresh service.

| What               | Where                                  |
| ------------------ | -------------------------------------- |
| Git clone          | `~/quest.clinbolt`                     |
| Build copy         | `/opt/quest-clinbolt/src` (user `questbot`) |
| Served files       | `/var/www/quest.clinbolt.com`          |
| Caddy site config  | `/etc/caddy/sites/quest.caddy`         |
| Access log         | `/var/log/caddy/quest.clinbolt.com.log` |

## How the sites share Caddy

`/etc/caddy/Caddyfile` contains a single line,
`import /etc/caddy/sites/*.caddy`. Each repo installs its own file there
through `deploy/caddy_site.sh`, which is identical in every clinbolt repo. It
validates the combined config and puts the previous files back if validation
fails, so one site's deploy can't overwrite or break another's.

The first time either repo runs `caddy_site.sh`, it converts the old
single-site Caddyfile to the import layout, keeping a copy as
`/etc/caddy/Caddyfile.pre-sites.<timestamp>`. It refuses to convert a
Caddyfile that serves some other site, because that would take the other site
offline. Update that site's repo first.

## First deploy

1. **DNS.** Add an `A` record `quest` → the VM's public IP (the same IP as
   `stats`). Wait until `dig +short quest.clinbolt.com` returns it, or Caddy's
   certificate request fails and has to retry.

2. **Move stats to the shared layout.** Its deploy scripts used to overwrite
   `/etc/caddy/Caddyfile`, so update it first:

   ```bash
   ssh clinbolt
   git -C ~/stats.clinbolt pull
   sudo bash ~/stats.clinbolt/deploy/update.sh
   ls /etc/caddy/sites/          # stats.caddy
   ```

3. **Clone, bootstrap, build.**

   ```bash
   git clone https://github.com/TechDlx/trialquest.clinbolt.git ~/quest.clinbolt
   sudo bash ~/quest.clinbolt/deploy/setup_vm.sh
   sudo bash ~/quest.clinbolt/deploy/update.sh
   ```

   `setup_vm.sh` installs Node 24 (if Node 20+ isn't already there), adds a
   2 GB swapfile if the VM has less than 1 GB of swap, creates the `questbot`
   build user and the directories, opens 80/443 (already open if stats is set
   up), and installs the Caddy site. The first `update.sh` run spends a few
   minutes on `npm ci`. Later runs skip it unless `package-lock.json` or the
   Node version changed.

## Updating

```bash
ssh clinbolt
sudo bash ~/quest.clinbolt/deploy/update.sh --pull
```

`update.sh` copies the checkout to the build directory, builds it with
`VITE_BASE=/`, and publishes `dist/` only if the build succeeds. A failed build
leaves the live site alone.

Installed copies of the PWA pick up the new build on their next visit.
`index.html`, `sw.js` and the manifest are served with `max-age=0`, and hashed
`/assets/*` are cached for a year.

## Checking

```bash
curl -I https://quest.clinbolt.com/                      # 200, CSP + no-cache headers
curl -I https://stats.clinbolt.com/                      # still 200
ls /etc/caddy/sites/                                     # quest.caddy  stats.caddy
sudo tail -f /var/log/caddy/quest.clinbolt.com.log
```

In a browser, the DevTools console should show no CSP errors, and
Application → Service workers should show `sw.js` activated.

## Troubleshooting

- **No certificate / connection refused.** Check DNS first. Ports can't be the
  cause if stats serves HTTPS. Then run
  `sudo journalctl -u caddy -n 50 --no-pager`.
- **Build killed (`Killed` / exit 137).** Out of memory. Check `free -m`
  shows the swapfile, and don't run the build at the same time as the stats
  refresh job (`systemctl status stats-refresh.service`).
- **`caddy_site.sh` refuses to convert the Caddyfile.** Another site is still
  in the old single-file layout. Run that site's `update.sh` first (step 2).
- **Roll back a bad release.** `git -C ~/quest.clinbolt checkout <good-commit>`
  then `sudo bash ~/quest.clinbolt/deploy/update.sh`. To return to normal,
  run `git -C ~/quest.clinbolt checkout main` before the next `--pull`.
