/**
 * HEAD Method Tests
 * Tests for retrieving metadata without body
 */

import assert from 'assert';

/**
 * @test-id lws:test-head-resource
 * @spec-section 4.5.1
 * @spec-requirement MUST return metadata without body
 * @level MUST
 */
export async function testHeadResource(client) {
  const path = `/test-head-resource.json`;

  // Create resource
  await client.createResource(path, { test: 'data' });

  // HEAD request
  const response = await client.head(path);

  assert.strictEqual(response.status, 200, 'Status should be 200');
  assert.ok(response.headers.get('ETag'), 'Should have ETag header');
  assert.ok(response.headers.get('Content-Type'), 'Should have Content-Type header');
  assert.ok(response.headers.get('Link'), 'Should have Link header');

  // Verify no body
  const body = await response.text();
  assert.strictEqual(body, '', 'Body should be empty');
}
