# Sun Steel Traders — sunsteeltraders.com

Multi-metal stockist, Simmakkal, Madurai. Website + admin, built on the Queens Inn codebase.
Design: **v3 "Metal atelier"** (ink navy, bronze, ivory; Cormorant Garamond + Manrope).

| Folder | What |
| --- | --- |
| `sunsteel.api` | ASP.NET Core .NET 9 API (vertical slices under `Features/`) |
| `sunsteel.web` | Angular 21 SSR + Tailwind CSS 4 (public site + admin) |
| `database/migrations` | MySQL 8 schema, forward-only SQL (source of truth) |
| `database/seed` | `catalog.json` (7 silos, 93 products, densities, IS 808, cities) → generates migration 010 |
| `deploy` | Nginx (with HTML micro-cache), systemd units, one-command deploy |

See **`CLAUDE.md`** for setup, commands, conventions and status.

## Quick look without .NET or MySQL

```bash
cd sunsteel.web
npm install
npm run mock-api          # terminal 1: mock API on :5090 (reads database/seed/catalog.json)
npm start                 # terminal 2: http://localhost:4200
```
