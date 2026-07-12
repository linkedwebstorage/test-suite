/**
 * lws10-core — metadata linkset resources (RFC 9264) and discovery.
 */
import assert from 'assert';

const LWS = 'https://www.w3.org/ns/lws#';

async function scratch(client) {
  return client.createContainer('/', 'm' + Math.random().toString(36).slice(2, 8));
}

export async function linksetDiscoverable(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'x.txt', 'x');
  const res = await client.get(p);
  const linkset = client.linkTarget(res, 'linkset');
  assert.ok(linkset, 'linkset discoverable via Link rel="linkset"');
}

export async function linksetShape(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'y.txt', 'x');
  const linkset = client.linkTarget(await client.get(p), 'linkset');
  const res = await fetch(linkset);
  assert.match(res.headers.get('content-type') || '', /application\/linkset\+json/, 'linkset is application/linkset+json');
  const body = await res.json();
  assert.ok(Array.isArray(body.linkset), 'RFC 9264 linkset array');
  assert.ok(body.linkset[0]?.anchor, 'linkset entry has an anchor');
}

export async function linksetPatchAdvertised(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'z.txt', 'x');
  const linkset = client.linkTarget(await client.get(p), 'linkset');
  const res = await fetch(linkset);
  assert.match(res.headers.get('allow') || '', /PATCH/, 'linkset Allow advertises PATCH');
  assert.match(res.headers.get('accept-patch') || '', /application\/merge-patch\+json/, 'Accept-Patch advertises merge-patch');
}

export async function linksetMergePatch(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'q.txt', 'x');
  const linkset = client.linkTarget(await client.get(p), 'linkset');
  const res = await fetch(linkset, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/merge-patch+json' },
    body: JSON.stringify({ 'http://purl.org/dc/terms/title': 'My Title' }),
  });
  assert.strictEqual(res.status, 204, 'user-managed linkset PATCH returns 204');
  const after = await (await fetch(linkset)).json();
  assert.ok(JSON.stringify(after).includes('My Title'), 'the added link is present');
}

export async function serverManagedLinkProtected(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'w.txt', 'x');
  const linkset = client.linkTarget(await client.get(p), 'linkset');
  const res = await fetch(linkset, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/merge-patch+json' },
    body: JSON.stringify({ type: 'http://example.org/Hacked' }),
  });
  assert.strictEqual(res.status, 409, 'patching a server-managed relation is rejected (409)');
}

export async function storageDescriptionDiscoverable(client) {
  const res = await client.get('/');
  const desc = client.linkTarget(res, `${LWS}storageDescription`);
  assert.ok(desc, 'storage description discoverable via Link');
  const body = await (await fetch(desc)).json();
  assert.strictEqual(body.type, 'Storage', 'description type is Storage');
  assert.ok((body.service || []).some((s) => s.type === 'StorageDescription' && s.serviceEndpoint),
    'a StorageDescription service is present');
}
