#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { chmod } from 'fs/promises';

async function build() {
  // Build the project
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outdir: 'build',
    sourcemap: true,
    external: [
      // External packages that should not be bundled
      '@darkforest_eth/*',
      '@modelcontextprotocol/*',
      'ethers',
      'big-integer',
      'delay'
    ],
  });

  // Make the output file executable
  await chmod('build/index.js', '755');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
}); 