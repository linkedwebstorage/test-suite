/**
 * DELETE Method Tests
 * Tests for deleting resources
 */

import assert from 'assert';

/**
 * @test-id lws:test-delete-resource
 * @spec-section 4.4.1
 * @spec-requirement MUST return 204 when deleting resource
 * @level MUST
 */
export async function testDeleteResource(client) {
  const path = `/test-delete-resource.json`;

  // Create resource
  await client.createResource(path, { test: true });

  // Delete resource
  const response = await client.delete(path);

  assert.strictEqual(response.status, 204, 'Status should be 204');

  // Verify deletion
  const verify = await client.get(path);
  assert.strictEqual(verify.status, 404, 'Resource should be deleted');
}

/**
 * @test-id lws:test-delete-404
 * @spec-section 4.4.1
 * @spec-requirement MUST return 404 for non-existent resource
 * @level MUST
 */
export async function testDelete404(client) {
  const response = await client.delete('/nonexistent-resource.json');

  assert.strictEqual(response.status, 404, 'Status should be 404');
}
