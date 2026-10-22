# Noel Palmdale – Noel Fest Event Planner

Static dashboard (no server, no dependencies).

## Editing (default)
Open `index.html`. You can type owners, add/remove participants, and use the search and
Event / Category filters.

1. **Save** (or Ctrl/Cmd+S) stores your draft in *your* browser.
2. **Publish** downloads `published.js`. Replace `published.js` on the host with it so the
   read-only link shows your changes.

## Read-only link (for everyone else)
Share the same address with `?view` added, e.g. `…/index.html?view`. Viewers see the published data
(`published.js`) and can search and filter, but cannot edit.

Notes
- `?view` is a convenience switch, not security. Control who can change the hosted files through your
  hosting platform (sign-in / permissions). `published.js` is readable by anyone with the link, so
  don't put sensitive data in it.
- Several owners editing at once: each publishes their own file, and the last upload wins. Agree on one
  person to upload, or merge changes first.
