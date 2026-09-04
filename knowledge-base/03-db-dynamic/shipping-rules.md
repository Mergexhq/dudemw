# KB — Shipping Rules (db-dynamic — SNAPSHOT ONLY)

> ⚠️ Snapshot 2026-09-04. Rates change via the admin dashboard without deploys. Answer live from
> `shipping_rules` / `/api/shipping`. All 12 active rules, provider "Standard", zone-based
> per-order quantity tiers.

| Zone | Min qty | Max qty | Rate (₹) |
|------|---------|---------|----------|
| tamil_nadu | 1 | 3 | 60 |
| tamil_nadu | 4 | — | 100 |
| south_india | 1 | 3 | 100 |
| south_india | 4 | — | 150 |
| north_india | 1 | 3 | 100 |
| north_india | 4 | — | 150 |
| east_india | 1 | 3 | 100 |
| east_india | 4 | — | 150 |
| west_india | 1 | 3 | 100 |
| west_india | 4 | — | 150 |
| all_india | 1 | 3 | 100 |
| all_india | 4 | — | 150 |

- **category:** Shipping & Delivery
- **intent:** "How much is shipping to <state>?" / "Shipping charges for 5 items?"
- **source:** `shipping_rules` (is_active=true, is_enabled=true)
- **source_type:** db-dynamic
- **verification_status:** VERIFIED (snapshot). Note: `shipping_zones` table has 0 rows — zones
  are referenced by string in rules only; zone→state mapping for customer questions is NOT
  defined anywhere in the DB (see KB-PEND-005).
- **source_location:** `shipping_rules` (12 rows)
- **refresh_requirement:** LIVE — query at answer time.
- **Related:** free-shipping-above-₹499 claim has no rule-table backing → KB-PEND-004.
