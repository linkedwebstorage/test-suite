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
import chalk from 'chalk';

export class TestRunner {
  constructor(options) {
    this.options = options;
    this.server = null;
    this.client = null;
  }

  printBanner() {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ${chalk.bold.white('██╗     ██╗    ██╗███████╗    ████████╗███████╗███████╗████████╗')}   ║
║   ${chalk.bold.white('██║     ██║    ██║██╔════╝    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝')}   ║
║   ${chalk.bold.white('██║     ██║ █╗ ██║███████╗       ██║   █████╗  ███████╗   ██║   ')}   ║
║   ${chalk.bold.white('██║     ██║███╗██║╚════██║       ██║   ██╔══╝  ╚════██║   ██║   ')}   ║
║   ${chalk.bold.white('███████╗╚███╔███╔╝███████║       ██║   ███████╗███████║   ██║   ')}   ║
║   ${chalk.bold.white('╚══════╝ ╚══╝╚══╝ ╚══════╝       ╚═╝   ╚══════╝╚══════╝   ╚═╝   ')}   ║
║                                                                   ║
║          ${chalk.bold.yellow('W3C Linked Web Storage Protocol Test Suite')}             ║
║              ${chalk.dim('Official conformance testing framework')}                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`));
  }

  async run() {
    this.printBanner();

    try {
      // Load configuration
      console.log(chalk.blue('⚙  Loading configuration...'));
      const config = await this.loadConfig();
      console.log(chalk.green(`✓  Testing: ${chalk.bold(config.name)} v${config.version}\n`));

      // Start server
      console.log(chalk.blue('🚀 Starting test server...'));
      this.server = new ServerManager(config);
      await this.server.start();
      console.log(chalk.green(`✓  Server ready at ${chalk.underline(config.baseUrl)}\n`));

      // Create client
      this.client = new TestClient(config.baseUrl, config.authentication);

      // Load manifests
      console.log(chalk.blue('📋 Loading test manifests...'));
      const manifestPath = resolve(process.cwd(), 'manifests/manifest.ttl');
      const parser = new ManifestParser(manifestPath);
      const tests = await parser.parse();
      console.log(chalk.green(`✓  Discovered ${chalk.bold(tests.length)} conformance tests\n`));

      // Filter tests
      const filteredTests = this.filterTests(tests);

      if (filteredTests.length < tests.length) {
        console.log(chalk.yellow(`⚡ Filtering to ${chalk.bold(filteredTests.length)} tests (level: ${this.options.level})\n`));
      }

      // Execute tests
      console.log(chalk.blue.bold(`🧪 Running ${filteredTests.length} tests...\n`));
      const results = await this.executeTests(filteredTests);

      // Generate reports
      console.log(chalk.blue('\n📊 Generating conformance reports...'));
      await this.generateReports(results, config);

      // Cleanup
      await this.cleanup(config);

      // Print summary
      this.printSummary(results);

      // Exit with appropriate code
      const failed = results.filter(r => r.outcome === 'failed').length;
      process.exit(failed > 0 ? 1 : 0);

    } catch (error) {
      console.error(chalk.red.bold('\n✗ Fatal error:'), error.message);
      if (this.options.verbose) {
        console.error(chalk.dim(error.stack));
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
        console.log(chalk.green(`  ✓ ${test.name}`) + chalk.dim(` (${duration}ms)`));
      } else {
        process.stdout.write(chalk.green('•'));
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
        console.log(chalk.red(`  ✗ ${test.name}`) + chalk.dim(` (${duration}ms)`));
        console.log(chalk.dim(`    ${error.message}`));
      } else {
        process.stdout.write(chalk.red('✗'));
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
      console.log(chalk.green(`   ✓ EARL (W3C):  ${chalk.dim(earlPath)}`));
    }

    // HTML Report
    if (reportFormats.includes('html')) {
      const html = new HtmlReporter(config.name, config.version);

      for (const result of results) {
        html.addResult(result.test, result.outcome, result.duration, result.error);
      }

      const htmlPath = resolve(process.cwd(), `reports/html/${config.name}.html`);
      await html.generateReport(htmlPath);
      console.log(chalk.green(`   ✓ HTML:        ${chalk.dim(htmlPath)}`));
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
      console.log(chalk.green(`   ✓ JSON:        ${chalk.dim(jsonPath)}`));
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

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = (totalDuration / total).toFixed(0);

    console.log('\n');
    console.log(chalk.cyan('╔════════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white('                        CONFORMANCE RESULTS                         ') + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════════════════╣'));

    // Pass rate bar
    const barWidth = 50;
    const passedBars = Math.round((passed / total) * barWidth);
    const failedBars = barWidth - passedBars;
    const passBar = chalk.green('█'.repeat(passedBars));
    const failBar = chalk.red('█'.repeat(failedBars));

    console.log(chalk.cyan('║  ') + passBar + failBar + '  ' + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════════════════╣'));

    // Stats
    const passRateColor = passRate >= 90 ? chalk.green.bold : passRate >= 70 ? chalk.yellow.bold : chalk.red.bold;
    console.log(chalk.cyan('║  ') + chalk.white('Total Tests:    ') + chalk.bold.white(total.toString().padEnd(45)) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.green('Passed:         ') + chalk.green.bold(passed.toString().padEnd(45)) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.red('Failed:         ') + chalk.red.bold(failed.toString().padEnd(45)) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.white('Pass Rate:      ') + passRateColor(passRate + '%'.padEnd(45)) + chalk.cyan('║'));
    console.log(chalk.cyan('║  ') + chalk.white('Avg Duration:   ') + chalk.dim(avgDuration + 'ms'.padEnd(45)) + chalk.cyan('║'));

    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════════════╝'));

    // Category breakdown
    const categories = {};
    results.forEach(r => {
      if (!categories[r.test.category]) {
        categories[r.test.category] = { passed: 0, failed: 0 };
      }
      categories[r.test.category][r.outcome]++;
    });

    console.log('\n' + chalk.bold.white('📊 Results by Category:\n'));
    Object.entries(categories).forEach(([category, stats]) => {
      const catTotal = stats.passed + stats.failed;
      const catRate = ((stats.passed / catTotal) * 100).toFixed(0);
      const icon = stats.failed === 0 ? chalk.green('✓') : chalk.yellow('⚠');
      console.log(`   ${icon} ${chalk.white(category.padEnd(25))} ${chalk.green(stats.passed)}/${catTotal} ${chalk.dim('(' + catRate + '%)')}`);
    });

    if (failed > 0) {
      console.log('\n' + chalk.bold.red('❌ Failed Tests:\n'));
      results.filter(r => r.outcome === 'failed').forEach(r => {
        console.log(chalk.red(`   ✗ ${r.test.name}`));
        console.log(chalk.dim(`     ${r.error}\n`));
      });
    } else {
      console.log('\n' + chalk.green.bold('🎉 All tests passed! Perfect conformance! 🎉\n'));
    }
  }
}
