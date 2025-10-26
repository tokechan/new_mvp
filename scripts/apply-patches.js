#!/usr/bin/env node

/**
 * Apply custom patch files under ./patches using the system `patch` utility.
 * The script runs on postinstall to ensure vendor fixes (e.g. path-to-regexp updates)
 * are consistently applied after every dependency install.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const patchesDir = path.join(repoRoot, 'patches');

if (!fs.existsSync(patchesDir)) {
  process.exit(0);
}

const patchFiles = fs
  .readdirSync(patchesDir)
  .filter((file) => file.endsWith('.patch'))
  .sort();

if (patchFiles.length === 0) {
  process.exit(0);
}

for (const file of patchFiles) {
  const patchPath = path.join(patchesDir, file);
  const result = spawnSync('patch', ['-p1', '--forward', '--silent', '--input', patchPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.status === 0) {
    console.log(`[apply-patches] applied ${file}`);
    continue;
  }

  if (result.status === 1) {
    console.log(`[apply-patches] skipped ${file} (already applied)`);
    continue;
  }

  console.error(`[apply-patches] failed to apply ${file}`);
  if (result.stderr) {
    console.error(result.stderr.trim());
  }
  process.exit(result.status ?? 1);
}

const staleDependencyDirs = [
  'node_modules/@vercel/node/node_modules/path-to-regexp',
  'node_modules/@vercel/remix-builder/node_modules/path-to-regexp',
];

for (const relPath of staleDependencyDirs) {
  const fullPath = path.join(repoRoot, relPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`[apply-patches] removed legacy dependency ${relPath}`);
  }
}
