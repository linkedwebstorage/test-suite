/**
 * lws10-core — LWS media type and content negotiation for containers.
 */
import assert from 'assert';

async function containerWithItem(client) {
  const c = await client.createContainer('/', 'mt' + Math.random().toString(36).slice(2, 8));
  await client.createDataResource(c, 'x.txt', 'x');
  return c;
}

export async function lwsJsonContentType(client) {
  const c = await containerWithItem(client);
  const res = await client.get(c, { headers: { Accept: 'application/lws+json' } });
  assert.match(res.headers.get('content-type') || '', /application\/lws\+json/);
}

export async function ldJsonNegotiation(client) {
  const c = await containerWithItem(client);
  const res = await client.get(c, { headers: { Accept: 'application/ld+json' } });
  assert.match(res.headers.get('content-type') || '', /application\/ld\+json/, 'ld+json negotiated');
}

export async function plainJsonNegotiation(client) {
  const c = await containerWithItem(client);
  const res = await client.get(c, { headers: { Accept: 'application/json' } });
  assert.match(res.headers.get('content-type') || '', /application\/json/, 'application/json negotiated');
}

export async function ldJsonProfileEquivalence(client) {
  const c = await containerWithItem(client);
  const res = await client.get(c, { headers: { Accept: 'application/ld+json; profile="https://www.w3.org/ns/lws/v1"' } });
  assert.match(res.headers.get('content-type') || '', /application\/lws\+json/,
    'ld+json;profile treated as application/lws+json');
}

export async function varyAcceptHeader(client) {
  const c = await containerWithItem(client);
  const res = await client.get(c, { headers: { Accept: 'application/lws+json' } });
  assert.match(res.headers.get('vary') || '', /Accept/i, 'Vary: Accept advertised');
}

export async function identicalBodyAcrossMediaTypes(client) {
  const c = await containerWithItem(client);
  const a = await client.json(c, { headers: { Accept: 'application/lws+json' } });
  const b = await client.json(c, { headers: { Accept: 'application/ld+json' } });
  assert.deepStrictEqual(a, b, 'body identical across media types (only Content-Type varies)');
}
