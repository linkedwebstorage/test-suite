/**
 * lws-access-requests — ODRL access-grant engine (read-gated server).
 * Config: LWS_PUBLIC_READ=0, LWS_WRITERS = identity('admin').did.
 */
import assert from 'assert';
import { identity } from '../lib/identity.js';

const admin = identity('admin');
const bob = identity('bob');
const bearer = (id) => ({ Authorization: 'Bearer ' + id.token() });
const FOAF = 'http://xmlns.com/foaf/0.1/Agent';

async function grant(client, access) {
  // discovery (GET /) is read-gated → authenticate as admin
  const ep = await client.serviceEndpoint('AccessGrantService', bearer(admin));
  return fetch(ep, {
    method: 'POST',
    headers: { 'Content-Type': 'application/lws+json', ...bearer(admin) },
    body: JSON.stringify({ '@context': ['https://www.w3.org/ns/lws/v1'], type: ['AccessGrant'], storage: client.baseUrl + '/', access }),
  });
}

// Each test seeds its own uniquely-named resource so grants don't overlap.
async function seed(client, tag) {
  const cRes = await client.post('/', '', { headers: { ...bearer(admin), Slug: tag, Link: '<https://www.w3.org/ns/lws#Container>; rel="type"' } });
  const c = client.rel(cRes.headers.get('location'));
  const dRes = await client.post(c, 'secret', { headers: { ...bearer(admin), 'Content-Type': 'text/plain', Slug: 'doc.txt' } });
  return { c, doc: client.rel(dRes.headers.get('location')) };
}

export async function adminCanWrite(client) {
  const res = await client.post('/', '', { headers: { ...bearer(admin), Slug: 'adm' + Math.random().toString(36).slice(2, 6), Link: '<https://www.w3.org/ns/lws#Container>; rel="type"' } });
  assert.strictEqual(res.status, 201, 'admin (in writers) can create');
}

export async function anonReadRefused(client) {
  const { doc } = await seed(client, 'az1' + Math.random().toString(36).slice(2, 6));
  assert.strictEqual((await client.get(doc)).status, 401, 'read with no auth is 401 (public-read off)');
}

export async function ungrantedAgentForbidden(client) {
  const { doc } = await seed(client, 'az2' + Math.random().toString(36).slice(2, 6));
  assert.strictEqual((await client.get(doc, { headers: bearer(bob) })).status, 403, 'bob without a grant is 403');
}

export async function readGrantAllows(client) {
  const { doc } = await seed(client, 'az3' + Math.random().toString(36).slice(2, 6));
  const g = await grant(client, [{ type: ['AccessPolicy'], action: ['read'], assignee: bob.did, target: { type: 'StorageResource', value: [client.baseUrl + doc] } }]);
  assert.strictEqual(g.status, 201, 'grant created');
  assert.strictEqual((await client.get(doc, { headers: bearer(bob) })).status, 200, 'bob reads after a read grant');
}

export async function readGrantDeniesWrite(client) {
  const { doc } = await seed(client, 'az4' + Math.random().toString(36).slice(2, 6));
  await grant(client, [{ type: ['AccessPolicy'], action: ['read'], assignee: bob.did, target: { type: 'StorageResource', value: [client.baseUrl + doc] } }]);
  const res = await client.put(doc, 'x', { headers: { ...bearer(bob), 'If-Match': '*', 'Content-Type': 'text/plain' } });
  assert.strictEqual(res.status, 403, 'read-only grant denies write');
}

export async function publicGrantAllowsAnon(client) {
  const { doc } = await seed(client, 'az5' + Math.random().toString(36).slice(2, 6));
  await grant(client, [{ type: ['AccessPolicy'], action: ['read'], assignee: FOAF, target: { type: 'StorageResource', value: [client.baseUrl + doc] } }]);
  assert.strictEqual((await client.get(doc)).status, 200, 'foaf:Agent grant permits anonymous read');
}

export async function expiredDateTimeConstraintDenies(client) {
  const { doc } = await seed(client, 'az6' + Math.random().toString(36).slice(2, 6));
  await grant(client, [{ type: ['AccessPolicy'], action: ['read'], assignee: bob.did, target: { type: 'StorageResource', value: [client.baseUrl + doc] }, constraint: [{ leftOperand: 'dateTime', operator: 'lteq', rightOperand: '2020-01-01T00:00:00Z' }] }]);
  assert.strictEqual((await client.get(doc, { headers: bearer(bob) })).status, 403, 'expired dateTime window denies');
}

export async function openDateTimeConstraintAllows(client) {
  const { doc } = await seed(client, 'az7' + Math.random().toString(36).slice(2, 6));
  await grant(client, [{ type: ['AccessPolicy'], action: ['read'], assignee: bob.did, target: { type: 'StorageResource', value: [client.baseUrl + doc] }, constraint: [{ leftOperand: 'dateTime', operator: 'lteq', rightOperand: '2099-01-01T00:00:00Z' }] }]);
  assert.strictEqual((await client.get(doc, { headers: bearer(bob) })).status, 200, 'open dateTime window allows');
}

export async function createGrantAllowsPost(client) {
  const { c } = await seed(client, 'az8' + Math.random().toString(36).slice(2, 6));
  await grant(client, [{ type: ['AccessPolicy'], action: ['create'], assignee: bob.did, target: { type: 'StorageResource', value: [client.baseUrl + c] } }]);
  const res = await client.post(c, 'hi', { headers: { ...bearer(bob), 'Content-Type': 'text/plain', Slug: 'bob.txt' } });
  assert.strictEqual(res.status, 201, 'create grant lets bob POST into the container');
}

export async function searchAuthorizationFiltered(client) {
  // one resource granted to bob, one deliberately ungranted
  const { doc: granted } = await seed(client, 'az9a' + Math.random().toString(36).slice(2, 6));
  const { doc: ungranted } = await seed(client, 'az9b' + Math.random().toString(36).slice(2, 6));
  await grant(client, [{ type: ['AccessPolicy'], action: ['read'], assignee: bob.did, target: { type: 'StorageResource', value: [client.baseUrl + granted] } }]);
  const ep = await client.serviceEndpoint('TypeSearchService', bearer(admin));
  const res = await fetch(`${ep}?type=${encodeURIComponent('https://www.w3.org/ns/lws#DataResource')}`, { headers: bearer(bob) });
  const ids = (await res.json()).items.map((i) => client.rel(i.id));
  assert.ok(ids.includes(granted), 'bob sees his granted resource');
  assert.ok(!ids.includes(ungranted), 'bob does not see a resource he has no grant for');
}
