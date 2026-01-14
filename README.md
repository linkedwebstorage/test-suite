# LWS Protocol Test Suite

W3C Linked Web Storage Protocol conformance test suite - MVP implementation covering core MUST-level requirements.

## Quick Start

```bash
# Install dependencies
npm install

# Test lws-server
npm test

# Test JavaScriptSolidServer
npm run test:jss

# View reports
open reports/html/lws-server.html
```

## About

This test suite validates compliance with the [W3C Linked Web Storage (LWS) Protocol](https://github.com/w3c/lws-protocol) specification. It generates W3C EARL conformance reports suitable for working group submissions.

## Test Coverage (MVP)

**Total: 29 tests** covering MUST-level requirements:

- **HTTP Methods** (12 tests): GET, PUT, POST, DELETE, HEAD, OPTIONS
- **ETags** (5 tests): ETag generation, If-Match, If-None-Match
- **Containers** (4 tests): JSON-LD format, @context, contains array
- **Headers** (6 tests): Link headers, CORS, Location, Allow
- **Error Handling**: 404, 412 status codes

## Installation

```bash
npm install @linkedwebstorage/test-suite
```

Or clone the repository:

```bash
git clone https://github.com/linkedwebstorage/test-suite
cd test-suite
npm install
```

## Usage

### Test an Implementation

```bash
# Test lws-server (managed - auto-starts server)
npm test -- --subject lws-server

# Test JavaScriptSolidServer
npm test -- --subject jss

# Test only MUST-level tests
npm test -- --level MUST

# Verbose output
npm test -- --verbose
```

### Custom Configuration

Create a config file for your implementation:

```json
{
  "name": "my-server",
  "version": "1.0.0",
  "type": "managed",
  "server": {
    "command": "node",
    "args": ["./my-server.js", "--port", "3128"],
    "startupTimeout": 5000,
    "healthCheck": {
      "url": "http://localhost:3128/",
      "expectedStatus": 200
    }
  },
  "baseUrl": "http://localhost:3128"
}
```

Run tests:

```bash
npm test -- --config ./my-server.config.json
```

### Test External Server

For a running server:

```json
{
  "name": "external-server",
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

## Reports

The suite generates three report formats:

### EARL Report (W3C Standard)

RDF Turtle format following [W3C EARL 1.0 Schema](https://www.w3.org/TR/EARL10-Schema/):

```
reports/earl/lws-server.ttl
```

### HTML Report (Human-Readable)

Interactive HTML report with test results, pass rates, and error details:

```
reports/html/lws-server.html
```

### JSON Report (Machine-Readable)

JSON format for CI/CD integration:

```
reports/json/lws-server.json
```

## Architecture

```
test-suite/
├── manifests/          # RDF Turtle test manifests
├── tests/              # Test implementations
├── lib/                # Test harness
├── config/             # Implementation configs
├── bin/                # CLI
└── reports/            # Generated reports
```

## Test Format

Tests are written in JavaScript with metadata annotations:

```javascript
/**
 * @test-id lws:test-get-resource
 * @spec-section 4.1.1
 * @spec-requirement MUST return 200 for existing resources
 * @level MUST
 */
export async function testGetResource(client) {
  const response = await client.get('/test.json');
  assert.strictEqual(response.status, 200);
}
```

## Requirements

- Node.js >= 18.0.0
- npm or yarn

## Dependencies

- `n3` - RDF Turtle parsing
- `commander` - CLI argument parsing
- `chalk` - Terminal colors

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding tests.

## License

[W3C Software License](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document)

## Acknowledgments

Created by the [W3C LWS Working Group](https://www.w3.org/groups/wg/lws/).

Built for testing:
- [lws-server](https://github.com/linkedwebstorage/lws-server) - Minimal LWS reference implementation
- [JavaScriptSolidServer](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer) - Full-featured LDP/LWS server

## References

- [W3C LWS Protocol Specification](https://github.com/w3c/lws-protocol)
- [W3C EARL 1.0 Schema](https://www.w3.org/TR/EARL10-Schema/)
- [Linked Data Platform](https://www.w3.org/TR/ldp/)
