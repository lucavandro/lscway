import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Apache .htaccess Routing & Trailing Slash Configuration', () => {
  const dotHtaccessPath = path.resolve(process.cwd(), 'static/.htaccess');
  const htaccessPath = path.resolve(process.cwd(), 'static/htaccess');

  it('keeps static/.htaccess and static/htaccess existing and identical', () => {
    expect(fs.existsSync(dotHtaccessPath)).toBe(true);
    expect(fs.existsSync(htaccessPath)).toBe(true);

    const dotContent = fs.readFileSync(dotHtaccessPath, 'utf-8');
    const content = fs.readFileSync(htaccessPath, 'utf-8');
    expect(dotContent.trim()).toBe(content.trim());
  });

  it('configures DirectorySlash Off with DirectoryIndex index.html', () => {
    const dotContent = fs.readFileSync(dotHtaccessPath, 'utf-8');
    expect(dotContent).toMatch(/DirectorySlash\s+Off/);
    expect(dotContent).toMatch(/DirectoryIndex\s+index\.html/);
  });

  it('configures RewriteOptions AllowNoSlash to allow mod_rewrite processing of slashless directories', () => {
    const dotContent = fs.readFileSync(dotHtaccessPath, 'utf-8');
    expect(dotContent).toMatch(/RewriteOptions\s+AllowNoSlash/);
  });

  it('handles slashless directory requests by redirecting to trailing slash with HTTPS', () => {
    const dotContent = fs.readFileSync(dotHtaccessPath, 'utf-8');
    expect(dotContent).toMatch(/RewriteCond\s+%{REQUEST_URI}\s+!\/\$/);
    expect(dotContent).toMatch(/RewriteCond\s+%{REQUEST_FILENAME}\s+-d/);
    expect(dotContent).toMatch(/RewriteCond\s+%{HTTP_HOST}\s+\^\(\?:www\\\.\)\?liceoscientificocortese\\\.edu\\\.it/);
    expect(dotContent).toMatch(/\[R=301,L,QSA\]/);
  });

  it('guards against insecure http:// redirects behind reverse proxies with Header edit Location', () => {
    const dotContent = fs.readFileSync(dotHtaccessPath, 'utf-8');
    expect(dotContent).toMatch(/Header\s+edit\s+Location\s+["']\^http:\/\/["']\s+["']https:\/\/["']/);
  });

  it('maintains SPA fallback to index.html', () => {
    const dotContent = fs.readFileSync(dotHtaccessPath, 'utf-8');
    expect(dotContent).toMatch(/RewriteRule\s+\^\s+index\.html\s+\[L\]/);
  });
});
