/**
 * RDF Manifest Parser
 * Parses Turtle manifests into test registry
 */

import { Parser, Store } from 'n3';
import { readFile } from 'fs/promises';
import { resolve, dirname, join } from 'path';

const MF = 'http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const LWS = 'https://w3c.github.io/lws-protocol/test-vocab#';

export class ManifestParser {
  constructor(manifestPath) {
    this.manifestPath = manifestPath;
    this.store = new Store();
  }

  async parse() {
    const tests = [];
    const manifestDir = dirname(this.manifestPath);

    // Load root manifest
    await this.loadManifest(this.manifestPath);

    // Find all included manifests
    const includes = this.store.getObjects(null, MF + 'include', null);

    for (const includeList of includes) {
      const items = this.parseRDFList(includeList);
      for (const item of items) {
        // Extract filename from URI
        const filename = item.value.split('/').pop();
        const includePath = resolve(manifestDir, filename);
        await this.loadManifest(includePath);
      }
    }

    // Extract all test entries
    const allEntries = this.store.getObjects(null, MF + 'entries', null);

    for (const entriesList of allEntries) {
      const entries = this.parseRDFList(entriesList);

      for (const testNode of entries) {
        const test = this.extractTest(testNode);
        if (test) {
          tests.push(test);
        }
      }
    }

    return tests;
  }

  async loadManifest(path) {
    const ttl = await readFile(path, 'utf-8');
    const parser = new Parser({ baseIRI: `file://${path}` });

    return new Promise((resolve, reject) => {
      parser.parse(ttl, (error, quad, prefixes) => {
        if (error) {
          reject(error);
        } else if (quad) {
          this.store.addQuad(quad);
        } else {
          resolve();
        }
      });
    });
  }

  parseRDFList(listNode) {
    const items = [];
    let current = listNode;

    while (current && current.value !== RDF + 'nil') {
      const first = this.store.getObjects(current, RDF + 'first', null)[0];
      if (first) {
        items.push(first);
      }

      const rest = this.store.getObjects(current, RDF + 'rest', null)[0];
      current = rest;
    }

    return items;
  }

  extractTest(testNode) {
    const getName = (pred) => this.store.getObjects(testNode, pred, null)[0]?.value;

    const id = testNode.value.split('#')[1] || testNode.value;
    const name = getName(MF + 'name');
    const comment = getName(RDFS + 'comment');
    const specSection = getName(LWS + 'specSection');
    const conformanceLevel = getName(LWS + 'conformanceLevel');
    const category = getName(LWS + 'category');
    const implementation = getName(LWS + 'testImplementation');

    if (!implementation) {
      console.warn(`Test ${id} has no implementation`);
      return null;
    }

    return {
      id,
      name,
      comment,
      specSection,
      conformanceLevel: conformanceLevel || 'MUST',
      category: category || 'General',
      implementation
    };
  }
}
