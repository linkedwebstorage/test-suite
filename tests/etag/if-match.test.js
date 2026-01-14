/**
 * If-Match Tests
 * Tests for conditional updates using ETags
 */

import assert from 'assert';

/**
 * @test-id lws:test-etag-generation
 * @spec-section 5.1.1
 * @spec-requirement MUST generate ETags for resources
 * @level MUST
 */
export async function testEtagGeneration(client) {
  const path = `/test-etag-generation.json`;

  await client.createResource(path, { test: true });

  const response = await client.get(path);

  const etag = response.headers.get('ETag');
  assert.ok(etag, 'Should have ETag header');
  assert.ok(etag.length > 0, 'ETag should not be empty');
}

/**
 * @test-id lws:test-if-match-success
 * @spec-section 5.2.1
 * @spec-requirement MUST update when ETag matches
 * @level MUST
 */
export async function testIfMatchSuccess(client) {
  const path = `/test-if-match-success.json`;

  // Create resource
  await client.createResource(path, { version: 1 });

  // Get ETag
  const getResponse = await client.get(path);
  const etag = getResponse.headers.get('ETag');

  // Update with matching ETag
  const updateResponse = await client.put(path, JSON.stringify({ version: 2 }), {
    headers: {
      'Content-Type': 'application/json',
      'If-Match': etag
    }
  });

  assert.strictEqual(updateResponse.status, 204, 'Should update with matching ETag');
}

/**
 * @test-id lws:test-if-match-fail
 * @spec-section 5.2.1
 * @spec-requirement MUST return 412 when ETag doesn't match
 * @level MUST
 */
export async function testIfMatchFail(client) {
  const path = `/test-if-match-fail.json`;

  // Create resource
  await client.createResource(path, { version: 1 });

  // Try to update with wrong ETag
  const response = await client.put(path, JSON.stringify({ version: 2 }), {
    headers: {
      'Content-Type': 'application/json',
      'If-Match': '"wrong-etag"'
    }
  });

  assert.strictEqual(response.status, 412, 'Should return 412 Precondition Failed');
}
