/**
 * lws10-core — container representation, membership, and pagination.
 */
import assert from 'assert';

const CTX = 'https://www.w3.org/ns/lws/v1';

async function scratch(client) {
  return client.createContainer('/', 'c' + Math.random().toString(36).slice(2, 8));
}

export async function containerRepresentation(client) {
  const c = await scratch(client);
  await client.createDataResource(c, 'doc.txt', 'hello');
  const res = await client.get(c, { headers: { Accept: 'application/lws+json' } });
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /application\/lws\+json/, 'container uses application/lws+json');
  const body = await res.json();
  assert.strictEqual(body['@context'], CTX, '@context is the LWS context');
  assert.strictEqual(body.type, 'Container');
  assert.strictEqual(body.totalItems, 1);
  assert.ok(Array.isArray(body.items));
}

export async function itemDescriptionFields(client) {
  const c = await scratch(client);
  await client.createDataResource(c, 'item.txt', 'hello');
  const body = await client.json(c, { headers: { Accept: 'application/lws+json' } });
  const item = body.items[0];
  assert.strictEqual(item.type, 'DataResource', 'item type is DataResource');
  assert.ok(item.id, 'item has id');
  assert.ok(item.mediaType, 'DataResource item has mediaType (MUST)');
  assert.ok(Number.isInteger(item.size), 'item has integer size');
  assert.ok(item.modified, 'item has modified timestamp');
}

export async function containmentUpLink(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'up.txt', 'x');
  const res = await client.get(p);
  assert.ok((res.headers.get('link') || '').includes('rel="up"'), 'rel="up" present on non-root resource');
}

export async function emptyContainerEmptyItems(client) {
  const c = await scratch(client);
  const body = await client.json(c, { headers: { Accept: 'application/lws+json' } });
  assert.strictEqual(body.totalItems, 0);
  assert.deepStrictEqual(body.items, [], 'empty container has empty items array');
}

export async function paginationLinks(client) {
  // server started with LWS_PAGE_SIZE=5; create 12 → 3 pages
  const c = await scratch(client);
  for (let i = 0; i < 12; i++) await client.createDataResource(c, `f${i}.txt`, String(i));
  const res = await client.get(c, { headers: { Accept: 'application/lws+json' } });
  const body = await res.json();
  assert.strictEqual(body.totalItems, 12, 'totalItems reflects full membership');
  assert.strictEqual(body.items.length, 5, 'items holds only the page');
  assert.ok(client.linkTarget(res, 'first'), 'rel="first" present (MUST on paginated)');
  assert.ok(client.linkTarget(res, 'next'), 'rel="next" present when more pages');
  assert.strictEqual(client.linkTarget(res, 'prev'), null, 'no rel="prev" on first page');
}

export async function paginationTraversal(client) {
  const c = await scratch(client);
  for (let i = 0; i < 12; i++) await client.createDataResource(c, `p${i}.txt`, String(i));
  const seen = new Set();
  let next = c; let pages = 0;
  while (next && pages < 10) {
    const res = await client.get(next, { headers: { Accept: 'application/lws+json' } });
    const body = await res.json();
    body.items.forEach((it) => seen.add(it.id));
    const nx = client.linkTarget(res, 'next');
    next = nx ? client.rel(nx) : null;
    pages++;
  }
  assert.strictEqual(seen.size, 12, `following next reassembles all items (got ${seen.size} over ${pages} pages)`);
}
