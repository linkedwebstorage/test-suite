/**
 * lws10-searchindex — TypeIndexService and TypeSearchService.
 */
import assert from 'assert';

const LWS = 'https://www.w3.org/ns/lws#';
const enc = encodeURIComponent;

async function seeded(client, type) {
  const c = await client.createContainer('/', 'si' + Math.random().toString(36).slice(2, 8));
  const p = await client.createDataResource(c, 'typed.txt', 'x', 'text/plain', [`<${type}>; rel="type"`]);
  return { c, p };
}

export async function typeIndexAdvertised(client) {
  const ep = await client.serviceEndpoint('TypeIndexService');
  assert.ok(ep, 'TypeIndexService advertised in storage description');
}

export async function typeIndexLists(client) {
  const t = 'https://schema.org/Recipe';
  await seeded(client, t);
  const ep = await client.serviceEndpoint('TypeIndexService');
  const body = await (await fetch(ep)).json();
  assert.strictEqual(body.type, 'TypeIndex');
  assert.ok(body.items.some((i) => i.id === t), 'declared type appears in the index');
}

export async function typeSearchSingleType(client) {
  const t = 'https://schema.org/Book';
  const { p } = await seeded(client, t);
  const ep = await client.serviceEndpoint('TypeSearchService');
  const body = await (await fetch(`${ep}?type=${enc(t)}`)).json();
  assert.strictEqual(body.type, 'ContainerPage');
  assert.ok(body.items.some((i) => client.rel(i.id) === p), 'resource with the type is found');
}

export async function typeSearchNativeContainerClass(client) {
  await seeded(client, 'https://schema.org/Thing');
  const ep = await client.serviceEndpoint('TypeSearchService');
  const body = await (await fetch(`${ep}?type=${enc(LWS + 'Container')}`)).json();
  assert.ok(body.items.every((i) => i.id.endsWith('/')), 'native Container class matches only containers');
}

export async function typeSearchPostCnf(client) {
  const t = 'https://schema.org/Article';
  const { p } = await seeded(client, t);
  const ep = await client.serviceEndpoint('TypeSearchService');
  const res = await fetch(ep, {
    method: 'POST',
    headers: { 'Content-Type': 'application/lws+json' },
    body: JSON.stringify({ type: [[t, 'https://schema.org/Nonexistent']] }),
  });
  const body = await res.json();
  assert.ok(body.items.some((i) => client.rel(i.id) === p), 'POST CNF OR-group matches');
}

export async function typeSearchNoMatchEmpty(client) {
  const ep = await client.serviceEndpoint('TypeSearchService');
  const res = await fetch(`${ep}?type=${enc('https://schema.org/DoesNotExistAnywhere')}`);
  assert.strictEqual(res.status, 200, 'no-match is 200, not an error');
  assert.strictEqual((await res.json()).items.length, 0, 'no-match yields empty items');
}

export async function typeSearchInvalidUri400(client) {
  const ep = await client.serviceEndpoint('TypeSearchService');
  const res = await fetch(`${ep}?type=not-an-absolute-uri`);
  assert.strictEqual(res.status, 400, 'non-absolute-URI value returns 400');
}

export async function typeSearchWrongMediaType415(client) {
  const ep = await client.serviceEndpoint('TypeSearchService');
  const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
  assert.strictEqual(res.status, 415, 'POST with wrong media type returns 415');
}

export async function typeSearchMalformedBody400(client) {
  const ep = await client.serviceEndpoint('TypeSearchService');
  const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/lws+json' }, body: JSON.stringify({ type: 42 }) });
  assert.strictEqual(res.status, 400, 'malformed type value returns 400');
}

export async function typeIndexDropsDeleted(client) {
  const t = 'https://schema.org/Ephemeral';
  const { p } = await seeded(client, t);
  await client.delete(p);
  const ep = await client.serviceEndpoint('TypeSearchService');
  const body = await (await fetch(`${ep}?type=${enc(t)}`)).json();
  assert.ok(!body.items.some((i) => client.rel(i.id) === p), 'deleted resource dropped from search');
}
