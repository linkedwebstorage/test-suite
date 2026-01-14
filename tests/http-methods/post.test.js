/**
 * POST Method Tests
 * Tests for creating resources with server-assigned URIs
 */

import assert from 'assert';

/**
 * @test-id lws:test-post-slug
 * @spec-section 4.3.1
 * @spec-requirement MUST create resource with Slug hint
 * @level MUST
 */
export async function testPostSlug(client) {
  const response = await client.post('/', JSON.stringify({ posted: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Slug': `test-slug-${Date.now()}`
    }
  });

  assert.strictEqual(response.status, 201, 'Status should be 201');

  const location = response.headers.get('Location');
  assert.ok(location, 'Should have Location header');
  assert.ok(location.includes('test-slug'), 'Location should include slug');
}

/**
 * @test-id lws:test-post-container
 * @spec-section 4.3.2
 * @spec-requirement MUST create container with Link header
 * @level MUST
 */
export async function testPostContainer(client) {
  const response = await client.post('/', null, {
    headers: {
      'Slug': `test-container-${Date.now()}`,
      'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
    }
  });

  assert.strictEqual(response.status, 201, 'Status should be 201');

  const location = response.headers.get('Location');
  assert.ok(location, 'Should have Location header');
  assert.ok(location.endsWith('/'), 'Container URI should end with /');
}
