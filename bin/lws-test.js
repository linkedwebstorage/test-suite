#!/usr/bin/env node

/**
 * LWS Protocol Conformance Test Suite CLI
 */

import { Command } from 'commander';
import { TestRunner } from '../lib/runner.js';

const program = new Command();

program
  .name('lws-test')
  .description('W3C Linked Web Storage Protocol Conformance Test Suite')
  .version('0.0.1')
  .option('--subject <name>', 'Test subject (lws-server, jss)', 'lws-server')
  .option('--config <path>', 'Custom config file path')
  .option('--level <level>', 'Conformance level filter (MUST, SHOULD, MAY)')
  .option('--report <format>', 'Report format (earl, html, json, all)', 'all')
  .option('--verbose', 'Verbose output with detailed test results')
  .parse();

const options = program.opts();

// Set verbose mode as environment variable
if (options.verbose) {
  process.env.VERBOSE = 'true';
}

const runner = new TestRunner(options);
await runner.run();
