#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { chmod, mkdir, cp } from 'fs/promises';
import path from 'path';
import fs from 'fs';

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
      'delay',
      // Add snarkjs and its dependencies to external
      'snarkjs',
      'ffjavascript',
      '@iden3/binfileutils',
      'crypto',
      'fs',
      'path',
      'os',
      'stream',
      'util'
    ],
  });

  // Make the output file executable
  await chmod('build/index.js', '755');
  
  // Copy SNARK files to the build directory
  console.log('Copying SNARK files to build directory...');
  
  // Create build/snarks directory if it doesn't exist
  const snarksDir = path.join('build', 'snarks');
  if (!fs.existsSync(snarksDir)) {
    await mkdir(snarksDir, { recursive: true });
  }
  
  // Copy all SNARK files
  const srcSnarksDir = path.join('src', 'snarks');
  const files = fs.readdirSync(srcSnarksDir);
  
  for (const file of files) {
    if (file.endsWith('.wasm') || file.endsWith('.zkey')) {
      await cp(
        path.join(srcSnarksDir, file),
        path.join(snarksDir, file)
      );
      console.log(`Copied ${file}`);
    }
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
}); 