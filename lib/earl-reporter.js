/**
 * EARL Reporter
 * Generates W3C EARL 1.0 conformance reports
 */

import { writeFile } from 'fs/promises';
import { Writer, DataFactory } from 'n3';

const { namedNode, literal, blankNode } = DataFactory;

const EARL = 'http://www.w3.org/ns/earl#';
const DOAP = 'http://usefulinc.com/ns/doap#';
const DC = 'http://purl.org/dc/terms/';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';

export class EarlReporter {
  constructor(subjectName, subjectUrl, version = '0.0.1') {
    this.subjectName = subjectName;
    this.subjectUrl = subjectUrl;
    this.version = version;
    this.assertions = [];
  }

  addResult(test, outcome, duration, error = null) {
    this.assertions.push({
      test,
      outcome,
      duration,
      error,
      timestamp: new Date().toISOString()
    });
  }

  async generateReport(outputPath) {
    const writer = new Writer({
      prefixes: {
        earl: EARL,
        doap: DOAP,
        dc: DC,
        rdf: RDF,
        xsd: XSD
      }
    });

    // Define test harness
    const harness = blankNode();

    writer.addQuad(
      harness,
      RDF + 'type',
      EARL + 'Software'
    );

    writer.addQuad(
      harness,
      RDF + 'type',
      DOAP + 'Project'
    );

    writer.addQuad(
      harness,
      DOAP + 'name',
      literal('LWS Protocol Test Suite')
    );

    writer.addQuad(
      harness,
      DOAP + 'homepage',
      namedNode('https://github.com/linkedwebstorage/test-suite')
    );

    // Define test subject
    const subject = blankNode();

    writer.addQuad(
      subject,
      RDF + 'type',
      EARL + 'TestSubject'
    );

    writer.addQuad(
      subject,
      RDF + 'type',
      DOAP + 'Project'
    );

    writer.addQuad(
      subject,
      DOAP + 'name',
      literal(this.subjectName)
    );

    if (this.subjectUrl) {
      writer.addQuad(
        subject,
        DOAP + 'homepage',
        namedNode(this.subjectUrl)
      );
    }

    if (this.version) {
      const release = blankNode();
      writer.addQuad(subject, DOAP + 'release', release);
      writer.addQuad(release, DOAP + 'revision', literal(this.version));
    }

    // Add assertions
    this.assertions.forEach((assertion, index) => {
      const assertionNode = blankNode();

      writer.addQuad(
        assertionNode,
        RDF + 'type',
        EARL + 'Assertion'
      );

      writer.addQuad(
        assertionNode,
        EARL + 'assertedBy',
        harness
      );

      writer.addQuad(
        assertionNode,
        EARL + 'subject',
        subject
      );

      writer.addQuad(
        assertionNode,
        EARL + 'test',
        namedNode(`https://w3c.github.io/lws-protocol/tests#${assertion.test.id}`)
      );

      // Add result
      const result = blankNode();
      writer.addQuad(assertionNode, EARL + 'result', result);

      writer.addQuad(result, RDF + 'type', EARL + 'TestResult');

      writer.addQuad(
        result,
        EARL + 'outcome',
        namedNode(EARL + assertion.outcome)
      );

      writer.addQuad(
        result,
        DC + 'date',
        literal(assertion.timestamp, namedNode(XSD + 'dateTime'))
      );

      if (assertion.duration !== undefined) {
        writer.addQuad(
          result,
          namedNode('http://schema.org/duration'),
          literal(assertion.duration.toString(), namedNode(XSD + 'integer'))
        );
      }

      if (assertion.error) {
        writer.addQuad(
          result,
          DC + 'description',
          literal(assertion.error)
        );
      }
    });

    // Write to file
    return new Promise((resolve, reject) => {
      writer.end(async (error, result) => {
        if (error) {
          reject(error);
        } else {
          await writeFile(outputPath, result, 'utf-8');
          resolve(outputPath);
        }
      });
    });
  }

  getSummary() {
    const total = this.assertions.length;
    const passed = this.assertions.filter(a => a.outcome === 'passed').length;
    const failed = this.assertions.filter(a => a.outcome === 'failed').length;
    const skipped = this.assertions.filter(a => a.outcome === 'inapplicable').length;

    return {
      total,
      passed,
      failed,
      skipped,
      passRate: total > 0 ? (passed / total) : 0
    };
  }
}
