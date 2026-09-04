# Dude Men's Wear — Chatbot Knowledge Base

> **Partnership deliverable (MergeX × Dude Men's Wear).** Structured knowledge artifact for the
> chatbot. This is NOT application code and is NOT yet integrated into any chatbot implementation.
>
> **Built from:** repo source files + live Neon DB (read-only SELECTs) as of
> **2026-09-04**. Every entry records its source and refresh requirement.

## Entry schema

Every KB entry carries:

| Field | Meaning |
|-------|---------|
| `category` | Topical grouping |
| `intent` | Customer question / goal this entry answers |
| `content` | The answer/knowledge itself (verbatim-preserved from source where possible) |
| `source` | Human-readable source name |
| `source_type` | `static-code` (hardcoded in repo, changes only via deploy) · `db-static` (DB-managed content, admin-editable, low churn) · `db-dynamic` (DB data that changes without deploys) · `context-doc` (MERGEX engagement doc) |
| `verification_status` | `VERIFIED` (single authoritative source) · `PENDING_CLIENT_CONFIRMATION` (conflict/gap — do not ship to customers until resolved) |
| `source_location` | Exact file:line or table+query |
| `refresh_requirement` | When this data goes stale and how it must be refreshed |

## Architecture: static vs dynamic

| Layer | Files | Nature | Refresh |
|-------|-------|--------|---------|
| `01-static/` | Size charts, courier map, order lifecycle | Static — changes only via code deploy | Re-extract on release |
| `02-db-static/` | FAQs, CMS policies, store identity, locations | Semi-static — admin edits via dashboard | Snapshot + periodic re-sync |
| `03-db-dynamic/` | Products, variants/stock, shipping rates, campaigns | **Dynamic — must be queried live at chat time, never hardcoded** | Live query; snapshots are audit trail only |
| `04-pending/` | Unresolved conflicts | Blocked from customer-facing use | Client answers |

**Golden rule:** dynamic data (prices, stock, rates, active offers) must eventually be retrieved
from the database/API at answer time. Files in `03-db-dynamic/` are point-in-time snapshots kept
for provenance and testing — the chatbot must not rely on them for live answers.

## Conflict rule

Where sources conflict (e.g. contact page vs `store_settings`), the DB value is treated as
canonical and the conflicting value is recorded in `04-pending/` — never silently resolved.

## Contents

- `01-static/` — 4 files (sizing, couriers, contact, order lifecycle)
- `02-db-static/` — FAQs, CMS policies, store identity, locations
- `03-db-dynamic/` — product catalogue snapshot, shipping rules, campaigns
- `04-pending/` — conflicts awaiting client confirmation
- `_extracts/` — raw machine extracts (audit trail)
