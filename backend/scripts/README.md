# PropLedger – Backend Scripts

This directory is reserved for one-off maintenance and seeding scripts.

## Planned scripts

| Script | Purpose |
|--------|---------|
| `seedSuperadmin.js` | Create the initial superadmin account |
| `migrateUsers.js`   | Migrate legacy `mobileNumber`-based accounts to email-based auth |

> **Note**: Scripts in this directory are run manually with `node scripts/<name>.js` from the `backend/` directory. They are **not** loaded by the server automatically.
