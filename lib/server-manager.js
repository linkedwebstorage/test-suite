/**
 * Server Lifecycle Management
 * Spawns and manages test server processes
 */

import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

export class ServerManager {
  constructor(config) {
    this.config = config;
    this.process = null;
  }

  async start() {
    if (this.config.type !== 'managed') {
      // External server, just verify it's accessible
      return await this.healthCheck();
    }

    const { command, args, env, startupTimeout } = this.config.server;

    console.log(`Starting server: ${command} ${args.join(' ')}`);

    this.process = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: 'pipe'
    });

    // Capture output for debugging
    this.process.stdout.on('data', (data) => {
      if (process.env.VERBOSE) {
        console.log(`[server] ${data.toString().trim()}`);
      }
    });

    this.process.stderr.on('data', (data) => {
      if (process.env.VERBOSE) {
        console.error(`[server error] ${data.toString().trim()}`);
      }
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Server process exited with code ${code}`);
      }
    });

    // Wait for server to be ready
    const ready = await this.waitForHealth(startupTimeout);
    if (!ready) {
      await this.stop();
      throw new Error(`Server failed to start within ${startupTimeout}ms`);
    }

    console.log('Server started successfully');
    return true;
  }

  async waitForHealth(timeout) {
    const startTime = Date.now();
    const { url, expectedStatus } = this.config.server.healthCheck;

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.status === expectedStatus) {
          return true;
        }
      } catch (err) {
        // Server not ready yet, continue waiting
      }
      await sleep(200);
    }

    return false;
  }

  async healthCheck() {
    const { url, expectedStatus } = this.config.server.healthCheck;

    try {
      const response = await fetch(url);
      if (response.status === expectedStatus) {
        console.log('External server health check passed');
        return true;
      }
    } catch (err) {
      throw new Error(`Health check failed for external server at ${url}: ${err.message}`);
    }

    return false;
  }

  async stop() {
    if (!this.process) {
      return;
    }

    console.log('Stopping server...');

    return new Promise((resolve) => {
      this.process.on('exit', () => {
        console.log('Server stopped');
        resolve();
      });

      this.process.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    });
  }
}
