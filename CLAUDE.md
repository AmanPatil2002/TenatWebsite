# TenatWebsite Project Tracker

## Project Overview
TenatWebsite is a multi-tenant website-template marketplace and site builder.

## Status
- **Current Phase**: Initial setup/familiarization.
- **Overall Health**: Baseline established from documentation.

## Working Plan / TODO
- [x] Explore existing codebase and verify functionality.
- [x] Fix: Database missing table `sitepages` (resolved by re-running `schema.sql`).
- [x] Removed unused `siteEntries` controller, routes, and logic.
- [x] Fixed 500 error on `/sites/client-admin/15/employees` - site 15 was missing its per-site database (dbName was null). Added missing `provisionError` column to `sites` table and provisioned database for site 15.
- [x] Fixed database inconsistencies for all sites (12 sites) where `dbName` was `NULL` but `provisionStatus` was `'ready'`.
- [x] Address any immediate bugs or technical debt (pending findings).
- [ ] Implement requested features.

## Last Worked On
- Consolidated redundant site-specific controllers (`siteContentController`, `siteMediaController`) into `siteDataController` to reduce code duplication and simplify maintenance. Verified that routes remain functional.

## Guidelines
- Follow the established stack: React 19, Vite, Express 5, MySQL.
- Maintain security best practices (server-side validation, no client-side price trust).
- Update this file regularly to reflect progress.
