/**
 * OPTIONS Method Tests
 * Tests for CORS and OPTIONS requests
 */

import assert from 'assert';

/**
 * @test-id lws:test-options-resource
 * @spec-section 4.6.1
 * @spec-requirement MUST return CORS headers
 * @level MUST
 */
export async function testOptionsResource(client) {
  const response = await client.options('/', {
    headers: {
      'Origin': 'https://example.com'
    }
  });

  assert.strictEqual(response.status, 204, 'Status should be 204');

  const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
  assert.ok(allowOrigin, 'Should have Access-Control-Allow-Origin header');

  const allowMethods = response.headers.get('Access-Control-Allow-Methods');
  assert.ok(allowMethods, 'Should have Access-Control-Allow-Methods header');
}
