# Turkey Location Dataset (Local)

Verified administrative hierarchy sourced from [TurkiyeAPI 2025](https://api.turkiyeapi.dev/v2/datasets/2025/).

| File | Records | Fields |
|------|---------|--------|
| `provinces.compact.json` | 81 cities | `id`, `name` |
| `districts.compact.json` | 973 districts | `id`, `name`, `provinceId` |
| `neighborhoods.compact.json` | 32,254 neighborhoods | `id`, `name`, `districtId` |

The seed engine reads **only** these compact local files (no runtime HTTP).

To refresh datasets:

```bash
curl -fsSL https://api.turkiyeapi.dev/v2/datasets/2025/provinces.json -o src/data/turkey-locations/provinces.json
curl -fsSL https://api.turkiyeapi.dev/v2/datasets/2025/districts.json -o src/data/turkey-locations/districts.json
curl -fsSL https://api.turkiyeapi.dev/v2/datasets/2025/neighborhoods.json -o src/data/turkey-locations/neighborhoods.json
node scripts/compact-turkey-locations.mjs
```
