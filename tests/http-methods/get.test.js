/**
 * GET Method Tests
 * Tests for retrieving resources and containers
 */

import assert from 'assert';

/**
 * @test-id lws:test-get-resource
 * @spec-section 4.1.1
 * @spec-requirement MUST return 200 for existing resources
 * @level MUST
 */
export async function testGetResource(client) {
  // Create a test resource
  const path = `/test-get-resource.json`;
  await client.createResource(path, { data: 'test' }, 'application/json');

  // GET the resource
  const response = await client.get(path);

  assert.strictEqual(response.status, 200, 'Status should be 200');
  assert.ok(response.headers.get('ETag'), 'Should have ETag header');
  assert.ok(response.headers.get('Link'), 'Should have Link header');

  const body = await response.text();
  assert.ok(body.length > 0, 'Body should not be empty');
}

/**
 * @test-id lws:test-get-404
 * @spec-section 4.1.1
 * @spec-requirement MUST return 404 for non-existent resources
 * @level MUST
 */
export async function testGet404(client) {
  const response = await client.get('/nonexistent-resource.json');

  assert.strictEqual(response.status, 404, 'Status should be 404');
}

/**
 * @test-id lws:test-get-container
 * @spec-section 4.1.2
 * @spec-requirement MUST return container contents
 * @level MUST
 */
export async function testGetContainer(client) {
  const response = await client.get('/');

  assert.strictEqual(response.status, 200, 'Status should be 200');

  const contentType = response.headers.get('Content-Type');
  assert.ok(
    contentType && contentType.includes('application/ld+json'),
    'Content-Type should be application/ld+json'
  );

  const link = response.headers.get('Link');
  assert.ok(link && link.includes('Container'), 'Link header should include Container');
}
