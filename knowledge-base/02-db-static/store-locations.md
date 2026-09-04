# KB — Store Locations (db-static snapshot)

> Source: `store_locations` (Neon DB), read-only SELECT, 2026-09-04. Both active rows.
> Chatbot should eventually answer from a live query or API; this snapshot is the verified baseline.

---

## KB-LC-001 — Main Store / Warehouse (primary)

- **category:** Store Locations
- **intent:** "Where is your store?" / "Where do you ship from?"
- **content:**
  - Name: Dude Mens Wear - Main Store
  - City: Salem, State: Tamil Nadu, Country: India
  - Type: warehouse · Primary: yes · Active: yes
  - Street address, pincode, phone, email, lat/long: held in DB columns
    (`address_line1`, `address_line2`, `pincode`, `phone`, `email`, `latitude`, `longitude`) —
    present in `02-db-static/store-locations.md` companion JSON extract; confirm completeness
    with client before reading them out verbatim (some admin-entered fields may be blank).
- **source:** `store_locations` WHERE name='Dude Mens Wear - Main Store'
- **source_type:** db-static
- **verification_status:** VERIFIED (city/state); street-level fields pending client review
- **source_location:** `store_locations` (is_primary=true, location_type='warehouse')
- **refresh_requirement:** Re-sync when admin edits locations.

---

## KB-LC-002 — Retail store

- **category:** Store Locations
- **intent:** "Do you have a physical shop I can visit?"
- **content:**
  - Name: Dude Mens Wear Store
  - City: SALEM, State: Tamil Nadu, Country: India
  - Type: store · Primary: yes · Active: yes
  - Street-level details as per DB columns (see KB-LC-001 note).
- **source:** `store_locations` WHERE name='Dude Mens Wear Store'
- **source_type:** db-static
- **verification_status:** VERIFIED (city/state)
- **source_location:** `store_locations` (location_type='store')
- **refresh_requirement:** Re-sync when admin edits locations.

---

## KB-LC-003 — About-page location claim

- **category:** Store Locations
- **intent:** (Supporting detail) "Where are you based?"
- **content:** About page (CMS): "located in **Tharamangalam, Salem District**" — Tharamangalam
  is a town in Salem district; consistent with the store_locations city of Salem. No conflict,
  but note the About page is more specific (town-level).
- **source:** `cms_pages` slug `about-us`
- **source_type:** db-static
- **verification_status:** VERIFIED
- **source_location:** `cms_pages` WHERE slug='about-us'
- **refresh_requirement:** Re-sync on admin edit.
