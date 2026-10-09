# sunsteel.web

Angular 21 (standalone, zoneless, SSR) + Tailwind CSS 4. Public site and admin in one app.

- `npm start` — dev server on :4200 (expects the API on :5090; use `npm run mock-api` if you have no .NET/MySQL)
- `npx ng build && node dist/sunsteel-web/server/server.mjs` — production SSR build on :4000
- Weight formulas: `src/app/core/weight/weight.ts`, checked by `weight.check.mjs` (see the comment at its top)

Structure: `core/` (services, models, routing, weight), `shared/` (design-system pieces: scale, xsection,
metal, search box, FAQ, page header), `layout/` (public shell, request drawer), `features/public` and
`features/admin`.
