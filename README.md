# W3C Linked Web Storage Protocol Test Suite

> Unofficial conformance test suite for the [W3C Linked Web Storage (LWS) Protocol](https://github.com/w3c/lws-protocol)

[![License](https://img.shields.io/badge/License-W3C-blue.svg)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)
[![Tests](https://img.shields.io/badge/tests-62%20passing-brightgreen.svg)](./reports/)
[![Coverage](https://img.shields.io/badge/drafts-core%20%7C%20search%20%7C%20notifications%20%7C%20authn%20%7C%20authz-brightgreen.svg)](./manifests/)

## Overview

An automated conformance suite for the **current editor's drafts** of the LWS protocol
(lws10-core, lws10-searchindex, lws10-notifications, and the did:key / ODRL authn/authz
suites). It discovers tests from Turtle manifests, runs them against a managed server, and
emits W3C **EARL** reports alongside HTML and JSON.

**62 conformance tests** across three server configurations, all passing against the reference
implementation [lwsd](https://github.com/linkedwebstorage/lwsd):

| Subject config | Tests | Draft areas |
|---|---|---|
| `lwsd` | 46 | core, containers, metadata, media-type, searchindex, notifications |
| `lwsd-authn` | 6 | did:key self-issued JWT credentials |
| `lwsd-authz` | 10 | ODRL access grants (read-gated server) |

## Quick Start

```bash
npm install

# main suite (46 tests) against the lwsd reference server
npm test

# authentication and authorization suites (their own server configs)
npm run test:authn
npm run test:authz

# everything
npm run test:all

open reports/html/lwsd.html
```

The `lwsd` configs launch `../lwsd` (a sibling checkout of the reference server). Point them at
any LWS server by editing `config/<name>.config.json` — `baseUrl`, the launch `command`, and the
`features` map (which categories the subject supports).

## Test Coverage

Categories map to draft documents; each test carries its spec section and conformance level and
appears in the EARL report.

| Category | Tests | Draft |
|---|---|---|
| **core** | 15 | lws10-core CRUD — POST-to-create, conditional PUT (428/412), content merge-patch, ranges, recursive delete, RFC 9457 errors |
| **containers** | 6 | container representation, membership, link-based pagination |
| **metadata** | 6 | RFC 9264 linksets, merge-patch, storage description discovery |
| **media-type** | 6 | `application/lws+json` + content negotiation (incl. `ld+json;profile`) |
| **searchindex** | 10 | TypeIndex / TypeSearch, CNF filter, strict 400/415 errors |
| **notifications** | 3 | webhook subscriptions, AS2 envelopes, RFC 9421 signatures |
| **authn** | 6 | did:key self-issued JWTs, 401 challenges |
| **authz** | 10 | ODRL access grants — actions, targets, dateTime/public constraints, search filtering |

## How it works

- **Manifests** (`manifests/*.ttl`) are W3C test manifests; each entry links a test to its
  implementation, spec section, conformance level, and category. Regenerate them from the central
  registry with `npm run manifests` (edit `tests/manifest-data.js`).
- **Tests** (`tests/*.test.js`) are plain functions `(client) => { … }` that throw on failure,
  using the LWS-aware `TestClient` (POST-create, container/linkset/discovery helpers).
- **Feature gating** — a subject's `config.features` map disables categories it doesn't support,
  so one manifest set serves servers at different capability levels.
- **Reports** — EARL (RDF/Turtle), HTML, and JSON, written to `reports/`.

## Reports

- **EARL** (`reports/earl/<subject>.ttl`) — machine-readable W3C conformance assertions
- **HTML** (`reports/html/<subject>.html`) — human-readable
- **JSON** (`reports/json/<subject>.json`) — CI/CD

## License

W3C Software and Document License
