# Family Emergency Kit Tracker

## Included
- Installable, mobile-friendly Progressive Web App (PWA)
- Inventory add/edit/delete, search and status filters
- Expiry dates, quantity, category, purchase date, location and notes
- 90/30/7-day reminder choices
- JSON export/import backups
- Local browser storage and offline app-shell caching

## Important limitations
- Inventory stays in the browser storage on each device. It does not sync automatically.
- Browser notifications are checked while the app is open. This starter version does not include guaranteed scheduled notifications when the app is closed. Reliable background push needs a server-side push service and subscription handling.
- Notifications and service workers require HTTPS (or localhost).

## Publish it so Android and Windows can install it
1. Create a free repository on GitHub and upload all files in this folder.
2. In the repository, open Settings → Pages.
3. Under Build and deployment, choose Deploy from a branch, select `main` and `/ (root)`, then Save.
4. Wait for GitHub Pages to publish the site. It will show you the public HTTPS address.
5. Open that address in Chrome on Android. Use Chrome's ⋮ menu → Install app or Add to Home screen.
6. Open the same address in Chrome or Edge on Windows and use the browser's Install app option.

Keep the JSON backup somewhere safe. Import it on another device if you want the same inventory there.

## Updating
Upload changed files to the repository. The service worker caches the app shell; close and reopen the installed app after the new deployment is available.
