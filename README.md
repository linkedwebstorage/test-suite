# W3C Linked Web Storage Protocol Test Suite

> Unofficial conformance test suite for the [W3C Linked Web Storage (LWS) Protocol](https://github.com/w3c/lws-protocol)

[![License](https://img.shields.io/badge/License-W3C-blue.svg)](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)
[![Tests](https://img.shields.io/badge/tests-27%20passing-brightgreen.svg)](./reports/)
[![Coverage](https://img.shields.io/badge/spec%20coverage-MUST%20level-brightgreen.svg)](./manifests/)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/linkedwebstorage/test-suite)

## Overview

This test suite validates conformance with the W3C Linked Web Storage Protocol specification. It provides automated testing, W3C EARL conformance reporting, and multi-implementation validation for LWS servers.

**Status:** MVP Release - Core MUST-level requirements (27 tests)

**Maintainer:** [W3C LWS Working Group](https://www.w3.org/groups/wg/lws/)

## Quick Start

```bash
# Install dependencies
npm install

# Test an LWS server implementation
npm test

# View conformance report
open reports/html/lws-server.html
```

## Features

- ✅ **W3C EARL 1.0 Reporting** - Machine-readable RDF conformance reports
- ✅ **Multi-Implementation Testing** - Test multiple LWS servers with a single command
- ✅ **Automated Server Management** - Auto-start/stop servers during testing
- ✅ **Spec Traceability** - Every test linked to specification section
- ✅ **Three Report Formats** - EARL (RDF), HTML (human), JSON (CI/CD)
- ✅ **Minimal Dependencies** - Only 3 runtime dependencies (n3, commander, chalk)
- ✅ **Standards Compliant** - Follows W3C testing best practices

## Test Coverage

### Current Coverage (v0.0.1)

**Total: 27 MUST-level conformance tests**

| Category | Tests | Status |
|----------|-------|--------|
| **HTTP Methods** | 12 | ✅ GET, PUT, POST, DELETE, HEAD, OPTIONS |
| **Concurrency Control** | 5 | ✅ ETags, If-Match, If-None-Match |
| **Containers** | 4 | ✅ JSON-LD format, @context, contains |
| **HTTP Headers** | 6 | ✅ Link, CORS, Location, Allow |

### Specification Sections Covered

- **§4.1** - Resource Retrieval (GET, HEAD)
- **§4.2** - Resource Creation & Update (PUT)
- **§4.3** - Server-Assigned URIs (POST)
- **§4.4** - Resource Deletion (DELETE)
- **§4.5** - Metadata Operations (HEAD)
- **§4.6** - CORS Support (OPTIONS)
- **§5** - Concurrency Control (ETags, Conditional Headers)
- **§6** - Container Operations (Listings, JSON-LD)
- **§7** - HTTP Headers (Link, CORS, Location)

### Conformance Levels

- ✅ **MUST** - 27 tests (100% coverage of core requirements)
- ⏳ **SHOULD** - Planned for v0.1.0
- ⏳ **MAY** - Planned for v0.2.0

## Installation

### Global Installation

```bash
npm install -g lws-test-suite
lws-test --subject lws-server
```

### Local Installation

```bash
npm install lws-test-suite
npx lws-test --subject lws-server
```

### From Source

```bash
git clone https://github.com/linkedwebstorage/test-suite
cd test-suite
npm install
npm test
```

## Usage

### Testing a Managed Server

For servers that can be started automatically:

```bash
# Test lws-server (auto-starts on port 3126)
npm test -- --subject lws-server

# Test JavaScriptSolidServer
npm test -- --subject jss

# Verbose output with detailed request/response logs
npm test -- --verbose
```

### Testing an External Server

For already-running servers:

1. Create a configuration file `my-server.config.json`:

```json
{
  "name": "my-lws-server",
  "version": "1.0.0",
  "type": "external",
  "server": {
    "healthCheck": {
      "url": "https://my-server.example.com/",
      "expectedStatus": 200
    }
  },
  "baseUrl": "https://my-server.example.com"
}
```

2. Run tests:

```bash
npm test -- --config my-server.config.json
```

### Testing a Custom Managed Server

For servers you want the suite to start/stop:

```json
{
  "name": "my-lws-server",
  "version": "1.0.0",
  "type": "managed",
  "server": {
    "command": "node",
    "args": ["./server.js", "--port", "3128"],
    "startupTimeout": 5000,
    "healthCheck": {
      "url": "http://localhost:3128/",
      "expectedStatus": 200
    }
  },
  "baseUrl": "http://localhost:3128",
  "cleanup": {
    "dataDirectory": "./test-data"
  }
}
```

### CLI Options

```
lws-test [options]

Options:
  --subject <name>     Test subject name (default: "lws-server")
  --config <path>      Custom configuration file
  --level <level>      Filter by conformance level (MUST, SHOULD, MAY)
  --report <format>    Report format: earl, html, json, all (default: "all")
  --verbose            Detailed test output with HTTP logs
  -V, --version        Output version number
  -h, --help           Display help
```

### Examples

```bash
# Test only MUST-level requirements
npm test -- --level MUST

# Generate only EARL report
npm test -- --report earl

# Test with verbose HTTP logging
npm test -- --verbose

# Test custom server
npm test -- --config ./servers/my-impl.config.json
```

## Reports

The test suite generates three complementary report formats:

### 1. EARL Report (W3C Standard)

**Format:** RDF Turtle (conforming to [W3C EARL 1.0 Schema](https://www.w3.org/TR/EARL10-Schema/))

**Location:** `reports/earl/{server-name}.ttl`

**Use Case:** Submitting conformance results to W3C working groups

**Example:**
```turtle
@prefix earl: <http://www.w3.org/ns/earl#> .

[] a earl:Assertion ;
   earl:assertedBy <#test-harness> ;
   earl:subject <#lws-server> ;
   earl:test <https://w3c.github.io/lws-protocol/tests#test-get-resource> ;
   earl:result [
     a earl:TestResult ;
     earl:outcome earl:passed ;
     dc:date "2026-01-14T16:00:00Z"^^xsd:dateTime
   ] .
```

### 2. HTML Report (Human-Readable)

**Format:** Interactive HTML with CSS

**Location:** `reports/html/{server-name}.html`

**Use Case:** Visual review of test results, sharing with team

**Features:**
- Color-coded pass/fail status
- Grouped by test category
- Pass rate visualization
- Detailed error messages
- Filterable results

### 3. JSON Report (Machine-Readable)

**Format:** Structured JSON

**Location:** `reports/json/{server-name}.json`

**Use Case:** CI/CD integration, automated processing

**Example:**
```json
{
  "subject": {
    "name": "lws-server",
    "version": "0.0.2"
  },
  "testDate": "2026-01-14T16:00:00Z",
  "results": [
    {
      "testId": "test-get-resource",
      "name": "GET existing resource",
      "level": "MUST",
      "outcome": "passed",
      "duration": 9
    }
  ]
}
```

## Architecture

### Directory Structure

```
test-suite/
├── manifests/              # RDF Turtle test manifests
│   ├── manifest.ttl       # Root manifest (links all tests)
│   ├── http-methods-manifest.ttl
│   ├── etag-manifest.ttl
│   ├── containers-manifest.ttl
│   └── headers-manifest.ttl
│
├── tests/                  # JavaScript test implementations
│   ├── http-methods/      # GET, PUT, POST, DELETE, HEAD, OPTIONS
│   ├── etag/              # If-Match, If-None-Match
│   ├── containers/        # JSON-LD listings
│   └── headers/           # Link, CORS, Location
│
├── lib/                    # Test harness
│   ├── runner.js          # Test orchestration
│   ├── client.js          # HTTP test client
│   ├── server-manager.js  # Server lifecycle
│   ├── manifest-parser.js # RDF manifest parser
│   ├── earl-reporter.js   # EARL report generator
│   └── html-reporter.js   # HTML report generator
│
├── config/                 # Implementation configurations
│   ├── test-subjects.ttl  # RDF registry
│   ├── lws-server.config.json
│   └── jss.config.json
│
├── bin/                    # CLI entry point
│   └── lws-test.js
│
└── reports/                # Generated reports (gitignored)
    ├── earl/
    ├── html/
    └── json/
```

### Test Format

Tests are JavaScript functions with metadata annotations:

```javascript
/**
 * @test-id lws:test-get-resource
 * @spec-section 4.1.1
 * @spec-requirement MUST return 200 for existing resources
 * @level MUST
 */
export async function testGetResource(client) {
  // Create test resource
  await client.createResource('/test.json', { data: 'test' });

  // Execute request
  const response = await client.get('/test.json');

  // Assert requirements
  assert.strictEqual(response.status, 200);
  assert.ok(response.headers.get('ETag'));
}
```

### Manifest Format

Tests are declared in RDF Turtle manifests:

```turtle
<#test-get-resource>
  rdf:type lws:ProtocolTest ;
  mf:name "GET existing resource" ;
  rdfs:comment "Server MUST return 200 for existing resources" ;
  lws:specSection "4.1.1" ;
  lws:conformanceLevel "MUST" ;
  lws:category "HTTP Methods" ;
  lws:testImplementation "tests/http-methods/get.test.js#testGetResource" .
```

## Tested Implementations

| Implementation | Version | Pass Rate | Report | Notes |
|----------------|---------|-----------|--------|-------|
| [lws-server](https://github.com/linkedwebstorage/lws-server) | 0.0.2 | 100% (27/27) | [View](./reports/html/lws-server.html) | Full compliance |
| [JavaScriptSolidServer](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer) | 0.0.77 | 14.8% (4/27) | [View](./reports/html/jss.html) | Requires authentication* |

**Authentication Note**: JavaScriptSolidServer requires authentication for all resource operations, even in `--lws-mode`. The test suite currently tests unauthenticated LWS protocol compliance. Only CORS/OPTIONS tests (4/27) pass without authentication. Future versions may add authentication support for testing authenticated LWS implementations.

## Contributing

### Adding New Tests

1. **Create test file** in appropriate category:
   ```javascript
   // tests/http-methods/patch.test.js
   export async function testPatchResource(client) {
     // Test implementation
   }
   ```

2. **Add to manifest**:
   ```turtle
   <#test-patch-resource>
     lws:testImplementation "tests/http-methods/patch.test.js#testPatchResource" .
   ```

3. **Run tests** to verify:
   ```bash
   npm test
   ```

### Test Guidelines

- **One assertion per test** - Each test validates a single specification requirement
- **Clear naming** - Use descriptive names: `testGetResource`, not `test1`
- **Metadata complete** - Always include @test-id, @spec-section, @level
- **Cleanup resources** - Use `client.createResource()` for automatic cleanup
- **Idempotent** - Tests should not depend on execution order

### Reporting Issues

Report bugs and feature requests at:
https://github.com/linkedwebstorage/test-suite/issues

## Roadmap

### v0.1.0 (Q2 2026)
- [ ] SHOULD-level tests (15+ additional tests)
- [ ] Enhanced error messages with debugging hints
- [ ] CI/CD integration examples (GitHub Actions)
- [ ] Performance benchmarking suite

### v0.2.0 (Q3 2026)
- [ ] MAY-level tests (optional features)
- [ ] Content negotiation tests (Turtle ↔ JSON-LD)
- [ ] WebSocket notification tests
- [ ] Batch testing (multiple implementations in one run)

### v1.0.0 (Q4 2026)
- [ ] Complete specification coverage
- [ ] Authentication/Authorization tests
- [ ] Web-based test runner UI
- [ ] W3C Recommendation track alignment

## Requirements

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0

## Dependencies

**Runtime (3 total):**
- `n3` (^1.17.2) - RDF Turtle parsing and generation
- `commander` (^11.1.0) - CLI argument parsing
- `chalk` (^5.3.0) - Terminal output formatting

**Development:**
- `lws-server` (^0.0.2) - Reference LWS implementation for testing

**Built-in (no install required):**
- `node:assert` - Test assertions
- `node:fs` - File system operations
- `fetch` - HTTP client (Node 18+)

## License

[W3C Software and Document License](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

Copyright © 2026 W3C® (MIT, ERCIM, Keio, Beihang)

This work is made available under the W3C Software and Document License, allowing free use, modification, and distribution with proper attribution.

## Acknowledgments

**Developed by:** [W3C LWS Working Group](https://www.w3.org/groups/wg/lws/)

**Built for testing:**
- [lws-server](https://github.com/linkedwebstorage/lws-server) - Minimal LWS reference implementation
- [JavaScriptSolidServer](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer) - Full-featured LDP/LWS/Solid server

**Special thanks to:**
- Solid Community for pioneering conformance testing approaches
- W3C LDP Working Group for foundational specifications
- Contributors to the RDF and Linked Data ecosystem

## References

### Specifications
- [W3C LWS Protocol](https://github.com/w3c/lws-protocol) - Linked Web Storage specification
- [W3C EARL 1.0](https://www.w3.org/TR/EARL10-Schema/) - Evaluation and Report Language
- [W3C LDP](https://www.w3.org/TR/ldp/) - Linked Data Platform

### Related Projects
- [Solid Conformance Test Harness](https://github.com/solid/conformance-test-harness)
- [W3C Web Platform Tests](https://github.com/web-platform-tests/wpt)
- [RDF Test Suites](https://w3c.github.io/rdf-tests/)

### W3C Resources
- [W3C Testing How-To](https://w3c.github.io/testing-how-to/)
- [W3C Test Methodology](https://www.w3.org/TR/test-methodology/)
- [W3C Process Document](https://www.w3.org/Consortium/Process/)

---

**Questions?** Contact the [W3C LWS Working Group](https://www.w3.org/groups/wg/lws/)

**Contributing?** See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
