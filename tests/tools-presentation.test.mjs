import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Tools and planner use the same scoped background without the atlas SVG', () => {
  const layout = read('_layouts/default.html');
  assert.match(layout, /page\.url == '\/books\/' or page\.url == '\/tools\/' or page\.url == '\/finance\/'/);
  assert.match(layout, /class="tool-surface"/);
  const css = read('assets/css/portfolio.scss');
  assert.match(css, /body\.tool-surface\s*\{[^}]*background-image:/);
  assert.doesNotMatch(css.match(/body\.tool-surface\s*\{[^}]*\}/)?.[0] || '', /url\(|\.svg/);
});

test('Tools opening leads directly to a single tool, without a second explanatory paragraph', () => {
  const page = read('tools.html');
  assert.match(page, /permalink: \/tools\//);
  assert.match(page, /<h1 id="tools-title">Tools/);
  assert.match(page, /<h2>Emergency fund planner<\/h2>/);
  assert.match(page, /₹ savings target/);
  assert.doesNotMatch(page, /\bINR\b/);
  assert.equal((page.match(/href="{{ '\/finance\/' \| relative_url }}"/g) || []).length, 1);
  assert.doesNotMatch(page, /class="tools-intro"/);
});

test('planner leads with its inputs while keeping guidance and privacy copy', () => {
  const page = read('finance/index.html');
  assert.ok(page.indexOf('id="fund-expenses"') < page.indexOf('id="fund-privacy"'));
  assert.doesNotMatch(page, /class="fund-hint"/);
  assert.match(page, /housing|groceries|utilities/i);
  assert.match(page, /not saved, uploaded, or sent to a server/i);
  assert.match(page, /YOUR PLAN \/ ₹/);
  assert.doesNotMatch(page, /\bINR\b/);
  assert.doesNotMatch(page, /placeholder="e\.g\. [\d,]*,\d+"/);
});
