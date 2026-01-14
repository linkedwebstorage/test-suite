/**
 * CORS Headers Tests
 * Tests for Cross-Origin Resource Sharing headers
 */

import assert from 'assert';

/**
 * @test-id lws:test-cors-allow-origin
 * @spec-section 7.3.1
 * @spec-requirement MUST include Access-Control-Allow-Origin header
 * @level MUST
 */
export async function testCorsAllowOrigin(client) {
  const response = await client.get('/');

  const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
  assert.ok(allowOrigin, 'Should have Access-Control-Allow-Origin header');
}

/**
 * @test-id lws:test-cors-allow-methods
 * @spec-section 7.3.2
 * @spec-requirement MUST include Access-Control-Allow-Methods header
 * @level MUST
 */
export async function testCorsAllowMethods(client) {
  const response = await client.options('/', {
    headers: { 'Origin': 'https://example.com' }
  });

  const allowMethods = response.headers.get('Access-Control-Allow-Methods');
  assert.ok(allowMethods, 'Should have Access-Control-Allow-Methods header');
}

/**
 * @test-id lws:test-allow-header
 * @spec-section 7.4.1
 * @spec-requirement MUST include Allow header with supported methods
 * @level MUST
 */
export async function testAllowHeader(client) {
  const response = await client.options('/');

  const allow = response.headers.get('Allow');
  assert.ok(allow, 'Should have Allow header');
  assert.ok(allow.includes('GET'), 'Allow should include GET');
}
