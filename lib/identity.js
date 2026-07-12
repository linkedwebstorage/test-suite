/**
 * Deterministic test identities for the authn/authz manifests.
 *
 * did:key (Ed25519) identities derived from fixed seeds, so a config file's
 * LWS_WRITERS value matches the token a test mints. `identity(name)` → { did,
 * token() }. `emitDid(name)` prints the DID for wiring into a config env.
 */

import { createPrivateKey, createPublicKey, sign as edSign } from 'crypto';

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const b64u = (b) => Buffer.from(b).toString('base64url');
function b58(buf) {
  let n = BigInt('0x' + buf.toString('hex')); let s = '';
  while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; }
  for (const x of buf) { if (x === 0) s = '1' + s; else break; }
  return s;
}

export function identity(seedName) {
  const seed = Buffer.alloc(32); Buffer.from('lws-suite-' + seedName).copy(seed);
  const pk = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' });
  const raw = Buffer.from(createPublicKey(pk).export({ format: 'jwk' }).x, 'base64url');
  const did = 'did:key:z' + b58(Buffer.concat([Buffer.from([0xed, 0x01]), raw]));
  const token = (opts = {}) => {
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      sub: did, iss: did, client_id: did, aud: 'https://as.example',
      iat: opts.iat ?? now, exp: opts.exp ?? now + 300, ...opts.claims,
    };
    const h = b64u(JSON.stringify({ typ: 'JWT', alg: 'EdDSA' }));
    const p = b64u(JSON.stringify(claims));
    return `${h}.${p}.${b64u(edSign(null, Buffer.from(h + '.' + p), pk))}`;
  };
  return { did, token };
}

// CLI: node lib/identity.js <seedName>  → prints the DID
if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(identity(process.argv[2] || 'writer').did);
}
