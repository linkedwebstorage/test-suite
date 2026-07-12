/**
 * lws10-core — CRUD, conditional updates, content PATCH, ranges, errors.
 * Current editor's draft: create is POST-only; PUT is update-only.
 */
import assert from 'assert';

const LWS = 'https://www.w3.org/ns/lws#';

async function scratch(client) {
  return client.createContainer('/', 't' + Math.random().toString(36).slice(2, 8));
}

export async function postCreatesDataResource(client) {
  const c = await scratch(client);
  const res = await client.post(c, 'hello', { headers: { 'Content-Type': 'text/plain', Slug: 'a.txt' } });
  assert.strictEqual(res.status, 201, 'POST to container returns 201');
  assert.ok(res.headers.get('location'), 'Location header set');
  const link = res.headers.get('link') || '';
  assert.ok(link.includes('rel="up"'), 'up link present');
  assert.ok(link.includes('rel="linkset"'), 'linkset link present');
  assert.ok(link.includes('rel="type"'), 'type link present');
}

export async function postToMissingContainer404(client) {
  const res = await client.post('/no-such-container-xyz/', 'x', { headers: { Slug: 'a' } });
  assert.strictEqual(res.status, 404, 'POST to missing container returns 404');
}

export async function getReturnsContentAndEtag(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'g.txt', 'body-content');
  const res = await client.get(p);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers.get('etag'), 'ETag present on GET');
  assert.match(res.headers.get('content-type') || '', /text\/plain/);
  assert.strictEqual(await res.text(), 'body-content');
}

export async function headMatchesGet(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'h.txt', 'x');
  const res = await client.head(p);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers.get('etag'), 'HEAD returns ETag');
  assert.strictEqual(await res.text(), '', 'HEAD has no body');
}

export async function conditionalGet304(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'c.txt', 'x');
  const etag = (await client.get(p)).headers.get('etag');
  const res = await client.get(p, { headers: { 'If-None-Match': etag } });
  assert.strictEqual(res.status, 304, 'If-None-Match match returns 304');
}

export async function rangeRequest206(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'r.txt', '0123456789');
  const res = await client.get(p, { headers: { Range: 'bytes=0-3' } });
  assert.strictEqual(res.status, 206, 'Range returns 206');
  assert.ok(res.headers.get('content-range'), 'Content-Range present');
  assert.strictEqual(await res.text(), '0123');
}

export async function unconditionalPut428(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'u.txt', 'x');
  const res = await client.put(p, 'y', { headers: { 'Content-Type': 'text/plain' } });
  assert.strictEqual(res.status, 428, 'ETag-supporting server rejects unconditional PUT with 428');
}

export async function staleIfMatch412(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 's.txt', 'x');
  const res = await client.put(p, 'y', { headers: { 'Content-Type': 'text/plain', 'If-Match': '"stale"' } });
  assert.strictEqual(res.status, 412, 'Stale If-Match returns 412');
}

export async function validIfMatchUpdates(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'v.txt', 'x');
  const etag = (await client.get(p)).headers.get('etag');
  const res = await client.put(p, 'updated', { headers: { 'Content-Type': 'text/plain', 'If-Match': etag } });
  assert.strictEqual(res.status, 204, 'Valid If-Match PUT returns 204');
  assert.ok(res.headers.get('etag') && res.headers.get('etag') !== etag, 'new ETag returned');
}

export async function putToMissing404(client) {
  const res = await client.put('/does-not-exist-put.txt', 'x', { headers: { 'If-Match': '*', 'Content-Type': 'text/plain' } });
  assert.strictEqual(res.status, 404, 'PUT to a missing resource returns 404 (create is POST)');
}

export async function contentMergePatch(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'p.json', '{"a":1,"b":{"c":2}}', 'application/json');
  const etag = (await client.get(p)).headers.get('etag');
  const res = await client.patch(p, '{"b":{"c":null,"d":3},"e":4}', {
    headers: { 'Content-Type': 'application/merge-patch+json', 'If-Match': etag },
  });
  assert.strictEqual(res.status, 204, 'merge-patch on JSON returns 204');
  const doc = await client.json(p);
  assert.deepStrictEqual(doc, { a: 1, b: { d: 3 }, e: 4 }, 'merge-patch applied correctly');
}

export async function mergePatchNonJson415(client) {
  const c = await scratch(client);
  const p = await client.createDataResource(c, 'n.txt', 'x');
  const res = await client.patch(p, '{}', { headers: { 'Content-Type': 'application/merge-patch+json' } });
  assert.strictEqual(res.status, 415, 'merge-patch on non-JSON returns 415');
}

export async function deleteNonEmptyContainer409(client) {
  const c = await client.createContainer('/', 'del' + Math.random().toString(36).slice(2, 6));
  await client.createDataResource(c, 'x.txt', 'x');
  const res = await client.delete(c);
  assert.strictEqual(res.status, 409, 'DELETE non-empty container returns 409');
}

export async function recursiveDelete(client) {
  const c = await client.createContainer('/', 'rec' + Math.random().toString(36).slice(2, 6));
  const p = await client.createDataResource(c, 'x.txt', 'x');
  const res = await client.delete(c, { headers: { Depth: 'infinity' } });
  assert.strictEqual(res.status, 204, 'DELETE with Depth: infinity returns 204');
  assert.strictEqual((await client.get(p)).status, 404, 'child is gone');
}

export async function errorsUseProblemJson(client) {
  const res = await client.post('/missing-container-abc/', 'x', { headers: { Slug: 'y' } });
  assert.match(res.headers.get('content-type') || '', /application\/problem\+json/, 'errors use RFC 9457 problem+json');
}
