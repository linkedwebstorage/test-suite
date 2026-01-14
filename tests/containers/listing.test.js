/**
 * Container Listing Tests
 * Tests for container operations and JSON-LD format
 */

import assert from 'assert';

/**
 * @test-id lws:test-container-jsonld
 * @spec-section 6.1.1
 * @spec-requirement MUST return containers as JSON-LD
 * @level MUST
 */
export async function testContainerJsonld(client) {
  const response = await client.get('/');

  assert.strictEqual(response.status, 200, 'Status should be 200');

  const contentType = response.headers.get('Content-Type');
  assert.ok(
    contentType && contentType.includes('application/ld+json'),
    'Content-Type should be application/ld+json'
  );

  const body = await response.json();
  assert.ok(body, 'Should have JSON body');
}

/**
 * @test-id lws:test-container-context
 * @spec-section 6.1.2
 * @spec-requirement MUST include proper @context in container listings
 * @level MUST
 */
export async function testContainerContext(client) {
  const response = await client.get('/');
  const body = await response.json();

  assert.ok(body['@context'], 'Should have @context');
  assert.ok(body['@vocab'] || (body['@context'] && body['@context']['@vocab']), 'Should have @vocab');
}

/**
 * @test-id lws:test-container-contains
 * @spec-section 6.1.3
 * @spec-requirement MUST include contains array with child resources
 * @level MUST
 */
export async function testContainerContains(client) {
  // Create a resource
  await client.createResource('/test-container-item.json', { test: true });

  const response = await client.get('/');
  const body = await response.json();

  assert.ok(body.contains !== undefined, 'Should have contains property');
  assert.ok(Array.isArray(body.contains), 'contains should be an array');
}

/**
 * @test-id lws:test-container-trailing-slash
 * @spec-section 6.1.4
 * @spec-requirement MUST handle container URIs with trailing slash
 * @level MUST
 */
export async function testContainerTrailingSlash(client) {
  const response = await client.get('/');

  assert.strictEqual(response.status, 200, 'Status should be 200');

  const body = await response.json();
  const id = body['@id'];
  assert.ok(id && id.endsWith('/'), 'Container @id should end with /');
}
