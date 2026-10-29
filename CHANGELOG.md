# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.6.0] - 2026-10-29

Initial open-source release of the existing v1.6 extension, prepared for
public development (license, docs, tests, CI). No intended behavior changes
versus the previously shipped v1.6 build, except cleanups noted below.

### Added

- GPL-3.0 license, README (EN/ID), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY,
  PRIVACY, THIRD_PARTY_NOTICES
- Vitest unit tests for the Rules model, unlock logic, import sanitization,
  URL helpers, and the blocking decision
- ESLint + Prettier configuration and npm scripts
  (`dev`, `build`, `zip`, `lint`, `format`, `test`, `typecheck`)
- GitHub Actions CI (lint, typecheck, test, build), release-zip workflow,
  Dependabot config, issue/PR templates
- `.env.example` documenting `WXT_WEB_URL` (dashboard origin)

### Changed

- Manifest version normalized to `1.6.0`
- `externally_connectable` is now omitted when `WXT_WEB_URL` is unset, so
  local builds produce a valid manifest
- Blocking decision extracted to a pure helper (`src/helpers/blocking.ts`)
  for testability; behavior unchanged
- `normalizeDomain` now accepts uppercase schemes (`HTTPS://…`)

### Removed

- Dead `isPaid` settings field (leftover paywall flag)
- Dead Vite template files (`vite.config.ts`, `tsconfig.app.json`,
  `tsconfig.node.json`, `App.css`, unused `GeometricDivider` component)

[1.6.0]: https://github.com/pandusudo/quran-discipline/releases/tag/v1.6.0
