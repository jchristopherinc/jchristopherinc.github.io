import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Tools follows Whoami in the shared header and stays current on tool detail', () => {
  const layout = read('_layouts/default.html');
  const nav = layout.match(/<nav class="site-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav, 'shared navigation must exist');
  assert.match(nav, /href="{{ '\/about\/' \| relative_url }}"[\s\S]*?href="{{ '\/tools\/' \| relative_url }}"[\s\S]*?href="{{ '\/blog\/' \| relative_url }}"/);
  assert.match(nav, /page\.url == '\/tools\/' or page\.url == '\/finance\/'/);
  assert.match(nav, /aria-current="page"/);
});

test('Tools landing lists exactly one dedicated calculator route', () => {
  const tools = read('tools.html');
  assert.match(tools, /permalink: \/tools\//);
  assert.match(tools, /Emergency fund planner/i);
  assert.equal((tools.match(/href="{{ '\/finance\/' \| relative_url }}"/g) || []).length, 1);
  assert.match(read('finance/index.html'), /permalink: \/finance\//);
});

test('home page contains no tool promotion or direct planner link', () => {
  const home = read('_layouts/home.html');
  assert.doesNotMatch(home, /class="experiment"|\/finance\/|Try the INR planner/);
  const styles = read('assets/css/portfolio.scss');
  assert.doesNotMatch(styles, /\.experiment(?:__row)?\b/);
});

test('tool belongs to Tools navigation without mixing into book or blog content', () => {
  const layout = read('_layouts/default.html');
  assert.equal((layout.match(/<a href="{{ '\/tools\/' \| relative_url }}"/g) || []).length, 2);
  assert.doesNotMatch(read('books.html'), /\/finance\/|class="tools-page"/);
  assert.doesNotMatch(read('blog.md'), /\/finance\//);
});
