# KB — Active Campaigns & Offers (db-dynamic — SNAPSHOT ONLY)

> ⚠️ Snapshot 2026-09-04. Campaigns are activated/deactivated in the admin dashboard without
> deploys. The chatbot must read live `campaigns` (status='active') before mentioning any offer.
> Coupon codes table (`coupons`) currently has **0 active rows** — the chatbot should never
> quote a coupon code from a snapshot.

## Active campaigns (3)

| Name | Status | Discount (per campaign_actions) | Applies to | Window |
|------|--------|--------------------------------|------------|--------|
| Special Offer: Buy 2 get ₹100 OFF (Cargo, Porsche & Polo) | active | flat ₹50 per item action* | items | started 2026-03-19, no end |
| Cargo & Porsche Special Deal | active | flat ₹50 per item action* | items | started 2026-03-19, no end |
| buy 3 product and get 150rs OFF | active | flat ₹50 per item action* | items | 2026-03-26 → 2026-12-30 |

\* **Known data inconsistency:** campaign NAMES promise "₹100 OFF / 150rs OFF", but every
`campaign_actions` row stores discount_value = **50**. Whether the storefront displays the name
or computes the action value is not determinable from the DB alone — the chatbot must not quote
either number until the client confirms (KB-PEND-006).

- **category:** Offers & Campaigns
- **intent:** "Any offers running?" / "Is there a discount?"
- **source:** `campaigns` (status='active') JOIN `campaign_actions`
- **source_type:** db-dynamic
- **verification_status:** PENDING_CLIENT_CONFIRMATION (name vs action-value mismatch)
- **source_location:** `campaigns` + `campaign_actions` + `campaign_rules`
- **refresh_requirement:** LIVE — query at answer time; campaigns change without deploys.

## Inactive campaigns (4 — historical, do not advertise)

"Baggy Track Pant - 3 for ₹600 Deal", "Buy 3 get 150rs OFF" (×2), "BUY 2 GET 100rs Off" —
status='inactive'; listed here only to prevent accidental re-quoting.
