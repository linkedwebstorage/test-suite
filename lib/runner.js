/**
 * Test Runner
 * Main test execution engine
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve, join } from 'path';
import { ServerManager } from './server-manager.js';
import { TestClient } from './client.js';
import { ManifestParser } from './manifest-parser.js';
import { EarlReporter } from './earl-reporter.js';
import { HtmlReporter } from './html-reporter.js';
import { rmSync, existsSync } from 'fs';

export class TestRunner {
  constructor(options) {
    this.options = options;
    this.server = null;
    this.client = null;
  }

  async run() {
    console.log('LWS Protocol Conformance Test Suite\n');

    try {
      // Load configuration
      const config = await this.loadConfig();

      // Start server
      this.server = new ServerManager(config);
      await this.server.start();

      // Create client
      this.client = new TestClient(config.baseUrl, config.authentication);

      // Load manifests
      const manifestPath = resolve(process.cwd(), 'manifests/manifest.ttl');
      const parser = new ManifestParser(manifestPath);
      const tests = await parser.parse();

      console.log(`\nFound ${tests.length} tests\n`);

      // Filter tests
      const filteredTests = this.filterTests(tests);

      console.log(`Running ${filteredTests.length} tests...\n`);

      // Execute tests
      const results = await this.executeTests(filteredTests);

      // Generate reports
      await this.generateReports(results, config);

      // Cleanup
      await this.cleanup(config);

      // Print summary
      this.printSummary(results);

      // Exit with appropriate code
      const failed = results.filter(r => r.outcome === 'failed').length;
      process.exit(failed > 0 ? 1 : 0);

    } catch (error) {
      console.error('Fatal error:', error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      await this.cleanup();
      process.exit(1);
    }
  }

  async loadConfig() {
    const { subject, config: configPath } = this.options;

    let configFile;
    if (configPath) {
      configFile = configPath;
    } else {
      configFile = resolve(process.cwd(), `config/${subject}.config.json`);
    }

    const content = await readFile(configFile, 'utf-8');
    return JSON.parse(content);
  }

  filterTests(tests) {
    let filtered = tests;

    // Filter by conformance level
    if (this.options.level) {
      const levels = ['MUST', 'SHOULD', 'MAY'];
      const minLevel = levels.indexOf(this.options.level);
      filtered = filtered.filter(t => {
        const testLevel = levels.indexOf(t.conformanceLevel);
        return testLevel <= minLevel;
      });
    }

    return filtered;
  }

  async executeTests(tests) {
    const results = [];

    for (const test of tests) {
      const result = await this.executeTest(test);
      results.push(result);
    }

    return results;
  }

  async executeTest(test) {
    const startTime = Date.now();

    try {
      // Import test module
      const [modulePath, functionName] = test.implementation.split('#');
      const testModule = await import(resolve(process.cwd(), modulePath));

      // Execute test function
      const testFn = testModule[functionName];

      if (!testFn) {
        throw new Error(`Test function ${functionName} not found in ${modulePath}`);
      }

      await testFn(this.client);

      const duration = Date.now() - startTime;

      if (this.options.verbose) {
        console.log(`✓ ${test.name} (${duration}ms)`);
      } else {
        process.stdout.write('.');
      }

      return {
        test,
        outcome: 'passed',
        duration,
        error: null
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      if (this.options.verbose) {
        console.log(`✗ ${test.name} (${duration}ms)`);
        console.log(`  ${error.message}`);
      } else {
        process.stdout.write('F');
      }

      return {
        test,
        outcome: 'failed',
        duration,
        error: error.message
      };
    }
  }

  async generateReports(results, config) {
    console.log('\n\nGenerating reports...');

    const reportFormats = this.options.report === 'all'
      ? ['earl', 'html', 'json']
      : [this.options.report];

    // EARL Report
    if (reportFormats.includes('earl')) {
      const earl = new EarlReporter(
        config.name,
        config.homepage || `https://github.com/linkedwebstorage/${config.name}`,
        config.version
      );

      for (const result of results) {
        earl.addResult(result.test, result.outcome, result.duration, result.error);
      }

      const earlPath = resolve(process.cwd(), `reports/earl/${config.name}.ttl`);
      await earl.generateReport(earlPath);
      console.log(`EARL report: ${earlPath}`);
    }

    // HTML Report
    if (reportFormats.includes('html')) {
      const html = new HtmlReporter(config.name, config.version);

      for (const result of results) {
        html.addResult(result.test, result.outcome, result.duration, result.error);
      }

      const htmlPath = resolve(process.cwd(), `reports/html/${config.name}.html`);
      await html.generateReport(htmlPath);
      console.log(`HTML report: ${htmlPath}`);
    }

    // JSON Report
    if (reportFormats.includes('json')) {
      const jsonPath = resolve(process.cwd(), `reports/json/${config.name}.json`);
      const jsonReport = {
        subject: {
          name: config.name,
          version: config.version,
          homepage: config.homepage
        },
        testDate: new Date().toISOString(),
        results: results.map(r => ({
          testId: r.test.id,
          name: r.test.name,
          category: r.test.category,
          level: r.test.conformanceLevel,
          outcome: r.outcome,
          duration: r.duration,
          error: r.error
        }))
      };

      await writeFile(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
      console.log(`JSON report: ${jsonPath}`);
    }
  }

  async cleanup(config) {
    if (this.client) {
      await this.client.cleanup();
    }

    if (this.server) {
      await this.server.stop();
    }

    // Clean test data directory
    if (config?.cleanup?.dataDirectory) {
      const dataDir = resolve(process.cwd(), config.cleanup.dataDirectory);
      if (existsSync(dataDir)) {
        rmSync(dataDir, { recursive: true, force: true });
      }
    }
  }

  printSummary(results) {
    const total = results.length;
    const passed = results.filter(r => r.outcome === 'passed').length;
    const failed = results.filter(r => r.outcome === 'failed').length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total:      ${total}`);
    console.log(`Passed:     ${passed}`);
    console.log(`Failed:     ${failed}`);
    console.log(`Pass Rate:  ${passRate}%`);
    console.log('='.repeat(50) + '\n');

    if (failed > 0) {
      console.log('Failed tests:');
      results.filter(r => r.outcome === 'failed').forEach(r => {
        console.log(`  - ${r.test.name}: ${r.error}`);
      });
      console.log();
    }
  }
}
