# Performance baseline (pre-optimization)

Captured from existing `.output/public/_nuxt` before optimization work (2026-09-09).

| Asset | Size |
|-------|------|
| Largest vendor/app chunk (`D6tdPKZ9.js`) | ~576 KB |
| Likely docx-preview (`SUZ-zo5S.js`) | ~168 KB |
| Likely Leaflet (`C210bVOb.js`) | ~146 KB |
| Entry CSS | ~110 KB |
| All `_nuxt` JS+CSS (approx) | ~1.54 MB raw / ~484 KB gzip |

Re-measure after changes with `pnpm analyze` and by comparing `_nuxt` chunk sizes after `pnpm generate`.

## Follow-ups (backend-dependent)

- Replace 20s cook-order notification polling with Capacitor push or a real WebSocket when the API supports it (do not reintroduce `socket.io-client` until the server uses it).
- Prefer API image thumbnails / sized variants for list grids when available.
