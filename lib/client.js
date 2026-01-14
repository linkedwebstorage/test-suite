/**
 * HTTP Test Client
 * Provides HTTP methods for testing LWS servers
 */

export class TestClient {
  constructor(baseUrl, authConfig = null) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.auth = authConfig;
    this.createdResources = [];
  }

  async get(path, options = {}) {
    return await this.request('GET', path, options);
  }

  async put(path, body, options = {}) {
    return await this.request('PUT', path, { ...options, body });
  }

  async post(path, body, options = {}) {
    return await this.request('POST', path, { ...options, body });
  }

  async delete(path, options = {}) {
    return await this.request('DELETE', path, options);
  }

  async head(path, options = {}) {
    return await this.request('HEAD', path, options);
  }

  async options(path, options = {}) {
    return await this.request('OPTIONS', path, options);
  }

  async createResource(path, content, contentType = 'application/json') {
    const body = typeof content === 'string' ? content : JSON.stringify(content);

    const response = await this.put(path, body, {
      headers: { 'Content-Type': contentType }
    });

    if (response.status !== 201 && response.status !== 204) {
      throw new Error(`Failed to create resource: ${response.status}`);
    }

    const location = response.headers.get('Location') || this.baseUrl + path;
    this.createdResources.push(path);

    return location;
  }

  async cleanup() {
    // Delete all resources created during testing
    for (const path of this.createdResources) {
      try {
        await this.delete(path);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    this.createdResources = [];
  }

  async request(method, path, options = {}) {
    const url = this.baseUrl + path;
    const headers = { ...options.headers };

    // Add authentication if configured
    if (this.auth) {
      if (this.auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${this.auth.token}`;
      } else if (this.auth.type === 'cookie' && this.auth.cookie) {
        headers['Cookie'] = this.auth.cookie;
      }
    }

    // Convert body if needed
    let body = options.body;
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      body = JSON.stringify(body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    if (process.env.VERBOSE) {
      console.log(`${method} ${url}`);
      if (headers) console.log('Headers:', headers);
    }

    const response = await fetch(url, {
      method,
      headers,
      body
    });

    if (process.env.VERBOSE) {
      console.log(`Response: ${response.status}`);
    }

    return response;
  }
}
