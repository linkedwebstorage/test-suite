/**
 * HTTP Test Client for LWS servers.
 *
 * Generic HTTP verbs plus LWS-aware helpers for the current draft:
 * POST-to-create (Slug + Link type), container/linkset reads, and storage
 * description service discovery. `baseUrl` is the storage root (may include a
 * mount prefix, e.g. http://localhost:PORT/lws).
 */

const LWS = 'https://www.w3.org/ns/lws#';

export class TestClient {
  constructor(baseUrl, authConfig = null) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.basePath = new URL(this.baseUrl).pathname.replace(/\/$/, ''); // e.g. /lws
    this.auth = authConfig;
    this.created = [];
    this._desc = null;
  }

  get(path, o = {}) { return this.request('GET', path, o); }
  put(path, body, o = {}) { return this.request('PUT', path, { ...o, body }); }
  post(path, body, o = {}) { return this.request('POST', path, { ...o, body }); }
  patch(path, body, o = {}) { return this.request('PATCH', path, { ...o, body }); }
  delete(path, o = {}) { return this.request('DELETE', path, o); }
  head(path, o = {}) { return this.request('HEAD', path, o); }
  options(path, o = {}) { return this.request('OPTIONS', path, o); }

  // --- LWS helpers ---------------------------------------------------------

  // Create a data resource in a container via POST (current draft: create is
  // POST-only). Returns the Location path (relative to baseUrl).
  async createDataResource(containerPath, slug, content, contentType = 'text/plain', extraLinks = []) {
    const body = typeof content === 'string' ? content : JSON.stringify(content);
    const headers = { 'Content-Type': contentType, Slug: slug };
    if (extraLinks.length) headers.Link = extraLinks.join(', ');
    const res = await this.post(containerPath, body, { headers });
    if (res.status !== 201) throw new Error(`create data resource failed: ${res.status}`);
    const loc = this.rel(res.headers.get('location'));
    this.created.unshift(loc);
    return loc;
  }

  // Create a sub-container via POST with the Container type Link.
  async createContainer(parentPath, slug) {
    const res = await this.post(parentPath, '', {
      headers: { Slug: slug, Link: `<${LWS}Container>; rel="type"` },
    });
    if (res.status !== 201) throw new Error(`create container failed: ${res.status}`);
    const loc = this.rel(res.headers.get('location'));
    this.created.unshift(loc);
    return loc;
  }

  async json(path, o = {}) { return (await this.get(path, o)).json(); }

  // Extract the first Link target for a rel from a response.
  linkTarget(res, rel) {
    const header = res.headers.get('link') || '';
    const re = new RegExp(`<([^>]+)>\\s*;\\s*rel="${rel.replace(/[.*+?^${}()|[\]\\#/]/g, '\\$&')}"`);
    return re.exec(header)?.[1] || null;
  }

  // Fetch (and cache) the storage description, returning a serviceEndpoint by
  // type. `authHeaders` authenticates the GET / discovery hop when reads are gated.
  async serviceEndpoint(type, authHeaders = {}) {
    if (!this._desc) {
      const descUrl = this.linkTarget(await this.get('/', { headers: authHeaders }), `${LWS}storageDescription`);
      if (!descUrl) return null;
      this._desc = await (await fetch(descUrl, { headers: authHeaders })).json();
    }
    return (this._desc.service || []).find((s) => s.type === type)?.serviceEndpoint || null;
  }

  // Make a URL relative to baseUrl, so client.get(rel) hits the right resource.
  // Handles full URLs, prefix-absolute paths (/lws/x), and bare paths.
  rel(url) {
    if (!url) return null;
    let p = url;
    if (/^https?:\/\//.test(url)) {
      if (url.startsWith(this.baseUrl)) return url.slice(this.baseUrl.length) || '/';
      try { p = new URL(url).pathname; } catch { return url; }
    }
    // p is now a path; strip the mount prefix if present
    if (this.basePath && p.startsWith(this.basePath + '/')) return p.slice(this.basePath.length);
    if (this.basePath && p === this.basePath) return '/';
    return p;
  }

  async cleanup() {
    for (const path of this.created) {
      try { await this.delete(path, { headers: { Depth: 'infinity' } }); } catch { /* ignore */ }
    }
    this.created = [];
  }

  async request(method, path, options = {}) {
    const url = /^https?:\/\//.test(path) ? path : this.baseUrl + path;
    // Default auth first; explicit per-request headers override it.
    const headers = {};
    if (this.auth) {
      if (this.auth.type === 'bearer') headers.Authorization = `Bearer ${this.auth.token}`;
      else if (this.auth.type === 'cookie' && this.auth.cookie) headers.Cookie = this.auth.cookie;
    }
    Object.assign(headers, options.headers);
    let body = options.body;
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      body = JSON.stringify(body);
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    }
    if (process.env.VERBOSE) console.log(`${method} ${url}`);
    const res = await fetch(url, { method, headers, body });
    if (process.env.VERBOSE) console.log(`→ ${res.status}`);
    return res;
  }
}
