# LobsterBoard Parity Plan

This document tracks feature parity work against:
- Upstream: `https://github.com/Curbob/LobsterBoard`
- Snapshot path in this repo: `upstream/lobsterboard/`

## Sync Model

1. A scheduled GitHub Action runs `scripts/sync-lobsterboard-upstream.js`.
2. If upstream changed, it updates:
   - `lobsterboard-resources/LOBSTERBOARD_VERSION`
   - `upstream/lobsterboard/**` snapshot files
3. The action opens a PR automatically with upstream diffs.
4. We port selected deltas into AGI Farm dashboard code and close parity gaps.

## Feature Buckets

`P0` (core platform)
- Template gallery import/export (merge/replace)
- Secret masking + separate secret store
- Public mode + PIN lock for write/edit APIs
- Multi-theme packs + persisted selection
- Canvas presets and font scaling controls

`P1` (extensibility + data)
- Custom pages plugin system (page folder + optional API routes)
- RSS/iCal proxy endpoints with SSRF protections
- Structured system logs endpoint for widgeting
- Directory-safe image browsing/latest-image widgets

`P2` (ecosystem)
- Community widget extension pattern
- Additional utility widgets from LobsterBoard

## Notes

- Implementations in AGI Farm should be **clean-room ports** (no direct code copying).
- LobsterBoard is Business Source License 1.1 (BSL-1.1); keep attribution explicit in docs.
