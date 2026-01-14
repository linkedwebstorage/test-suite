/**
 * If-None-Match Tests
 * Tests for conditional creation using If-None-Match header
 */

import assert from 'assert';

/**
 * @test-id lws:test-if-none-match-create
 * @spec-section 5.3.1
 * @spec-requirement MUST create resource when If-None-Match: *
 * @level MUST
 */
export async function testIfNoneMatchCreate(client) {
  const path = `/test-if-none-match-create-${Date.now()}.json`;

  const response = await client.put(path, JSON.stringify({ created: true }), {
    headers: {
      'Content-Type': 'application/json',
      'If-None-Match': '*'
    }
  });

  assert.strictEqual(response.status, 201, 'Should create with If-None-Match: *');
}

/**
 * @test-id lws:test-if-none-match-prevent
 * @spec-section 5.3.1
 * @spec-requirement MUST return 412 when resource exists
 * @level MUST
 */
export async function testIfNoneMatchPrevent(client) {
  const path = `/test-if-none-match-prevent.json`;

  // Create resource first
  await client.createResource(path, { exists: true });

  // Try to create again with If-None-Match: *
  const response = await client.put(path, JSON.stringify({ overwrite: true }), {
    headers: {
      'Content-Type': 'application/json',
      'If-None-Match': '*'
    }
  });

  assert.strictEqual(response.status, 412, 'Should return 412 when resource exists');
}
