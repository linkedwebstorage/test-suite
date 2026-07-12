/**
 * lws10-notifications — webhook subscriptions, AS2 envelopes, RFC 9421 signatures.
 */
import assert from 'assert';
import { createServer } from 'http';
import { createHash, createPublicKey, verify as cryptoVerify } from 'crypto';

function inbox() {
  let resolveGot;
  const got = new Promise((r) => { resolveGot = r; });
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c)).on('end', () => {
      resolveGot({ headers: req.headers, body: Buffer.concat(chunks).toString() });
      res.writeHead(200).end();
    });
  });
  return { server, got };
}

export async function notificationServiceAdvertised(client) {
  const ep = await client.serviceEndpoint('NotificationService');
  assert.ok(ep, 'NotificationService advertised in storage description');
}

export async function subscriptionLifecycle(client) {
  const ep = await client.serviceEndpoint('NotificationService');
  const c = await client.createContainer('/', 'nt' + Math.random().toString(36).slice(2, 8));
  const res = await fetch(ep, {
    method: 'POST',
    headers: { 'Content-Type': 'application/lws+json' },
    body: JSON.stringify({ '@context': ['https://www.w3.org/ns/lws/v1'], type: 'WebhookSubscription', topic: [client.baseUrl + c], inbox: 'http://127.0.0.1:1/x' }),
  });
  assert.strictEqual(res.status, 200, 'subscription create returns 200');
  const body = await res.json();
  assert.ok(body.subscription, 'response carries a subscription URL');
  const get = await fetch(body.subscription);
  assert.strictEqual((await get.json()).type, 'WebhookSubscription', 'GET subscription returns its state');
  const del = await fetch(body.subscription, { method: 'DELETE' });
  assert.strictEqual(del.status, 204, 'DELETE subscription returns 204');
}

export async function webhookDeliveryAndSignature(client) {
  const { server, got } = inbox();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const inboxUrl = `http://127.0.0.1:${server.address().port}/hook`;
  try {
    const ep = await client.serviceEndpoint('NotificationService');
    const c = await client.createContainer('/', 'nd' + Math.random().toString(36).slice(2, 8));
    await fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/lws+json' },
      body: JSON.stringify({ '@context': ['https://www.w3.org/ns/lws/v1'], type: 'WebhookSubscription', topic: [client.baseUrl + c], inbox: inboxUrl }),
    });
    // trigger a Create inside the subscribed container
    await client.createDataResource(c, 'trigger.txt', 'hi');
    const received = await Promise.race([got, new Promise((_, rej) => setTimeout(() => rej(new Error('no webhook within 4s')), 4000))]);

    const env = JSON.parse(received.body);
    assert.strictEqual(env.type, 'Notification', 'envelope type Notification');
    assert.ok(env.storage && env.activity, 'envelope has storage + activity');
    const act = [].concat(env.activity)[0];
    assert.ok(act.type.includes('Create'), 'Create activity');
    assert.ok(act.object?.id?.endsWith('/trigger.txt'), 'activity object is the created resource');
    assert.ok(act.published, 'activity has published timestamp');

    assert.ok(received.headers['content-digest'], 'content-digest header (RFC 9530)');
    assert.ok(received.headers.signature && received.headers['signature-input'], 'signature headers (RFC 9421)');

    // verify signature against the key published in the storage description
    const desc = await (await fetch(await client.serviceEndpoint('StorageDescription'))).json();
    const vm = desc.verificationMethod?.[0];
    assert.ok(vm?.publicKeyJwk, 'signing key published as a verificationMethod');
    const created = /created=(\d+)/.exec(received.headers['signature-input'])[1];
    const keyid = /keyid="([^"]+)"/.exec(received.headers['signature-input'])[1];
    const u = new URL(inboxUrl);
    const base = [
      '"@method": POST', '"@scheme": http', `"@authority": ${u.host}`, `"@path": ${u.pathname}`,
      '"content-type": application/lws+json', `"content-digest": ${received.headers['content-digest']}`,
      `"@signature-params": ("@method" "@scheme" "@authority" "@path" "content-type" "content-digest");created=${created};keyid="${keyid}"`,
    ].join('\n');
    const sig = Buffer.from(/:([^:]+):/.exec(received.headers.signature)[1], 'base64');
    const ok = cryptoVerify('SHA256', Buffer.from(base), { key: createPublicKey({ key: vm.publicKeyJwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }, sig);
    assert.ok(ok, 'RFC 9421 signature verifies against the published key');

    const digestOk = 'sha-256=:' + createHash('sha256').update(received.body).digest('base64') + ':' === received.headers['content-digest'];
    assert.ok(digestOk, 'content-digest matches the body (RFC 9530)');
  } finally {
    server.close();
  }
}
