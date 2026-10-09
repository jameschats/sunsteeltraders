# Deployment (filled in at Stage 8)

Same pattern as DailyCalendarShop: Nginx (TLS, /uploads, proxy) → `sunsteel-api.service` (127.0.0.1:5090)
and `sunsteel-ssr.service` (127.0.0.1:4130, env API_BASE_URL, SITE_URL, ALLOWED_HOSTS). Write
`/config.js` per environment with the same API_BASE_URL / SITE_URL.
