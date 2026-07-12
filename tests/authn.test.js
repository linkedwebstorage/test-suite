/**
 * lws10-authn-ssi-did-key — self-issued did:key JWT credentials.
 * Server config: LWS_WRITERS = the DID for identity('writer').
 */
import assert from 'assert';
import { identity } from '../lib/identity.js';

const writer = identity('writer');
const other = identity('intruder');
const bearer = (t) => ({ Authorization: 'Bearer ' + t });

export async function anonWriteChallenged(client) {
  const res = await client.post('/', 'x', { headers: { Slug: 'anon' } });
  assert.strictEqual(res.status, 401, 'anonymous write returns 401');
  const wa = res.headers.get('www-authenticate') || '';
  assert.match(wa, /as_uri=/, 'WWW-Authenticate carries as_uri');
  assert.match(wa, /realm=/, 'WWW-Authenticate carries realm');
}

export async function validDidKeyAccepted(client) {
  const res = await client.post('/', '', { headers: { ...bearer(writer.token()), Slug: 'authc' + Math.random().toString(36).slice(2, 6), Link: '<https://www.w3.org/ns/lws#Container>; rel="type"' } });
  assert.strictEqual(res.status, 201, 'valid did:key JWT (in writers) is accepted');
}

export async function expiredRejected(client) {
  const now = Math.floor(Date.now() / 1000);
  const res = await client.post('/', 'x', { headers: { ...bearer(writer.token({ iat: now - 600, exp: now - 300 })), Slug: 'exp' } });
  assert.strictEqual(res.status, 401, 'expired JWT is rejected');
}

export async function tamperedRejected(client) {
  const t = writer.token();
  const res = await client.post('/', 'x', { headers: { ...bearer(t.slice(0, -4) + 'AAAA'), Slug: 'tam' } });
  assert.strictEqual(res.status, 401, 'tampered signature is rejected');
}

export async function subjectMismatchRejected(client) {
  const now = Math.floor(Date.now() / 1000);
  // a token whose sub != iss violates the suite (sub===iss===client_id)
  const t = writer.token({ claims: { iss: 'did:key:zOtherMismatch' } });
  const res = await client.post('/', 'x', { headers: { ...bearer(t), Slug: 'mis' } });
  assert.strictEqual(res.status, 401, 'sub/iss mismatch is rejected');
}

export async function unauthorizedAgentForbidden(client) {
  // a valid did:key JWT, but this DID is not in the writer allowlist
  const res = await client.post('/', 'x', { headers: { ...bearer(other.token()), Slug: 'oth' } });
  assert.strictEqual(res.status, 403, 'valid but unauthorized agent is 403');
}
