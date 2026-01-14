/**
 * Link Headers Tests
 * Tests for LDP/LWS Link headers
 */

import assert from 'assert';

/**
 * @test-id lws:test-link-resource
 * @spec-section 7.1.1
 * @spec-requirement MUST include ldp#Resource in Link header
 * @level MUST
 */
export async function testLinkResource(client) {
  const path = `/test-link-resource.json`;
  await client.createResource(path, { test: true });

  const response = await client.get(path);

  const link = response.headers.get('Link');
  assert.ok(link, 'Should have Link header');
  assert.ok(link.includes('ldp#Resource'), 'Link header should include ldp#Resource');
}

/**
 * @test-id lws:test-link-container
 * @spec-section 7.1.2
 * @spec-requirement MUST include ldp#Container in Link header
 * @level MUST
 */
export async function testLinkContainer(client) {
  const response = await client.get('/');

  const link = response.headers.get('Link');
  assert.ok(link, 'Should have Link header');
  assert.ok(link.includes('ldp#Container'), 'Link header should include ldp#Container');
}

/**
 * @test-id lws:test-location-header
 * @spec-section 7.2.1
 * @spec-requirement MUST include Location header on 201 Created
 * @level MUST
 */
export async function testLocationHeader(client) {
  const path = `/test-location-${Date.now()}.json`;

  const response = await client.put(path, JSON.stringify({ test: true }), {
    headers: { 'Content-Type': 'application/json' }
  });

  assert.strictEqual(response.status, 201, 'Status should be 201');

  const location = response.headers.get('Location');
  assert.ok(location, 'Should have Location header');
  assert.ok(location.includes(path), 'Location should include resource path');
}
