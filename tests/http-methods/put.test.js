/**
 * PUT Method Tests
 * Tests for creating and updating resources
 */

import assert from 'assert';

/**
 * @test-id lws:test-put-create
 * @spec-section 4.2.1
 * @spec-requirement MUST return 201 when creating new resource
 * @level MUST
 */
export async function testPutCreate(client) {
  const path = `/test-put-create-${Date.now()}.json`;
  const response = await client.put(path, JSON.stringify({ test: true }), {
    headers: { 'Content-Type': 'application/json' }
  });

  assert.strictEqual(response.status, 201, 'Status should be 201 for new resource');
  assert.ok(response.headers.get('Location'), 'Should have Location header');
}

/**
 * @test-id lws:test-put-update
 * @spec-section 4.2.1
 * @spec-requirement MUST return 204 when updating existing resource
 * @level MUST
 */
export async function testPutUpdate(client) {
  const path = `/test-put-update.json`;

  // Create resource
  await client.createResource(path, { version: 1 });

  // Update resource
  const response = await client.put(path, JSON.stringify({ version: 2 }), {
    headers: { 'Content-Type': 'application/json' }
  });

  assert.strictEqual(response.status, 204, 'Status should be 204 for update');
}

/**
 * @test-id lws:test-put-if-none-match
 * @spec-section 4.2.2
 * @spec-requirement MUST respect If-None-Match: * header
 * @level MUST
 */
export async function testPutIfNoneMatch(client) {
  const path = `/test-put-if-none-match-${Date.now()}.json`;

  // Create with If-None-Match: *
  const response1 = await client.put(path, JSON.stringify({ test: true }), {
    headers: {
      'Content-Type': 'application/json',
      'If-None-Match': '*'
    }
  });

  assert.strictEqual(response1.status, 201, 'Should create new resource');

  // Try to create again with If-None-Match: * (should fail)
  const response2 = await client.put(path, JSON.stringify({ test: false }), {
    headers: {
      'Content-Type': 'application/json',
      'If-None-Match': '*'
    }
  });

  assert.strictEqual(response2.status, 412, 'Should return 412 when resource exists');
}
