import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { APP_VERSION } from '$lib/version.js';

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

describe('Unified SemVer Versioning System', () => {
  it('exports a valid SemVer string in src/lib/version.js', () => {
    expect(typeof APP_VERSION).toBe('string');
    expect(APP_VERSION).toMatch(SEMVER_REGEX);
  });

  it('keeps package.json version synchronized with APP_VERSION', () => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.version).toMatch(SEMVER_REGEX);
    expect(pkg.version).toBe(APP_VERSION);
  });

  it('keeps src/app.html APP_VERSION synchronized with src/lib/version.js', () => {
    const appHtmlPath = path.resolve(process.cwd(), 'src/app.html');
    const appHtmlContent = fs.readFileSync(appHtmlPath, 'utf-8');
    const match = appHtmlContent.match(/var\s+APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    expect(match).not.toBeNull();
    expect(match[1]).toBe(APP_VERSION);
  });

  it('keeps static/service-worker.js CACHE_VERSION synchronized with src/lib/version.js', () => {
    const swPath = path.resolve(process.cwd(), 'static/service-worker.js');
    const swContent = fs.readFileSync(swPath, 'utf-8');
    const match = swContent.match(/const\s+CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
    expect(match).not.toBeNull();
    expect(match[1]).toBe(`v${APP_VERSION}`);
  });
});
