'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { fetchLanguages } = require('../src/github');
const { getColor, DEFAULT_COLOR } = require('../src/colors');
const { renderCard } = require('../src/card');
const handler = require('../api');

function mockGitHub(t, reported, tree, treeStatus = 200) {
  return t.mock.method(global, 'fetch', async url => {
    if (url.endsWith('/languages')) return Response.json(reported);
    assert.ok(url.endsWith('/git/trees/HEAD?recursive=1'));
    return Response.json(tree, { status: treeStatus });
  });
}

function blob(path, size, mode = '100644') {
  return { path, size, mode, type: 'blob' };
}

test('mixes source bytes into the same percentages and caches the complete breakdown', async t => {
  const fetch = mockGitHub(t, { Rust: 50 }, { tree: [
    blob('src/program.AHEUI', 20), blob('examples/test.umm', 30, '100755'),
    blob('shortcut.umm', 100, '120000'), blob('docs.aheui/readme.md', 100),
    blob('hello.umm.bak', 100), blob('empty.aheui', 0),
  ] });
  const data = await fetchLanguages('test', 'mixed');
  assert.deepEqual(data.map(({language, bytes, percentage}) => [language, bytes, percentage]), [
    ['Rust', 50, 50], ['umjunsik-lang', 30, 30], ['Aheui', 20, 20],
  ]);
  assert.deepEqual(await fetchLanguages('test', 'mixed'), data);
  assert.equal(fetch.mock.callCount(), 2);
  assert.equal(getColor('Aheui'), '#0026ff');
  assert.equal(getColor('umjunsik-lang'), '#e36b35');
  assert.equal(getColor('엄랭'), getColor('umjunsik-lang'));
  assert.equal(getColor('아희'), getColor('Aheui'));
  assert.equal(getColor('Umlang'), DEFAULT_COLOR);
});

test('handles a repository with only supplemental source', async t => {
  mockGitHub(t, {}, { tree: [blob('program.umm', 40)] });
  assert.deepEqual(await fetchLanguages('test', 'only'), [
    { language: 'umjunsik-lang', bytes: 40, percentage: 100 },
  ]);
});

test('detects esoteric source extensions without claiming similarly named files', async t => {
  mockGitHub(t, {}, { tree: [
    blob('program.hyeong', 40), blob('hello.ARNOLDC', 30), blob('recipes/soup.chef', 20),
    blob('cat.chicken', 6), blob('hello.chic', 4),
    blob('recipe.chef.rb', 200), blob('header.ch', 100), blob('program.hy', 60),
  ] });
  const data = await fetchLanguages('test', 'esolangs');
  assert.deepEqual(data.map(({ language, bytes }) => [language, bytes]), [
    ['Hyeo-ung', 40], ['ArnoldC', 30], ['Chef', 20], ['Chicken', 10],
  ]);
  for (const { language } of data) assert.notEqual(getColor(language), DEFAULT_COLOR);
  assert.equal(getColor('Hyeong'), getColor('Hyeo-ung'));
  assert.equal(getColor('혀엉'), getColor('Hyeo-ung'));
});

test('keeps native GitHub totals if GitHub already reports the language', async t => {
  mockGitHub(t, { 아희: 30, Aheui: 50 }, { tree: [blob('main.aheui', 80)] });
  assert.deepEqual(await fetchLanguages('test', 'native'), [
    { language: 'Aheui', bytes: 80, percentage: 100 },
  ]);
});

test('renders English labels for legacy names and preserves standard GitHub labels', () => {
  const languages = ['엄랭', '아희', '혀엉', 'JavaScript', 'Terraform'];
  const svg = renderCard(languages.map(language => ({ language, percentage: 20 })), 'test', 'names');
  const labels = [...svg.matchAll(/<text x="15"[^>]*>([^<]+)<\/text>/g)].map(match => match[1]);
  assert.deepEqual(labels, ['umjunsik-lang', 'Aheui', 'Hyeo-ung', 'JavaScript', 'Terraform']);
});

test('renders auto by default and switches all theme colors only for auto', () => {
  const languages = [{ language: 'JavaScript', percentage: 100 }];
  const defaultTheme = renderCard(languages, 'test', 'default');
  const light = renderCard(languages, 'test', 'light', 'light');
  const dark = renderCard(languages, 'test', 'dark', 'dark');
  const automatic = renderCard(languages, 'test', 'automatic', 'auto');

  assert.match(defaultTheme, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(light, /prefers-color-scheme/);
  for (const svg of [defaultTheme, light]) {
    assert.match(svg, /class="card-background"[^>]*fill="#ffffff" stroke="#e4e2e2"/);
    assert.match(svg, /class="card-title"[^>]*fill="#2d333b"/);
    assert.match(svg, /class="card-label"[^>]*fill="#636e7b"/);
    assert.match(svg, /class="card-percent"[^>]*fill="#2d333b"/);
  }
  assert.doesNotMatch(dark, /prefers-color-scheme/);
  assert.match(dark, /class="card-background"[^>]*fill="#0d1117" stroke="#30363d"/);
  assert.match(dark, /class="card-title"[^>]*fill="#e6edf3"/);
  assert.match(dark, /class="card-label"[^>]*fill="#8b949e"/);
  assert.match(dark, /class="card-percent"[^>]*fill="#e6edf3"/);
  assert.match(automatic, /@media \(prefers-color-scheme: dark\)/);
  assert.match(automatic, /\.card-background \{ fill: #0d1117; stroke: #30363d; \}/);
  assert.match(automatic, /\.card-title, \.card-percent \{ fill: #e6edf3; \}/);
  assert.match(automatic, /\.card-label \{ fill: #8b949e; \}/);
});

test('defaults the API to auto and supports explicit light, dark, and auto themes', async t => {
  mockGitHub(t, { JavaScript: 1 }, { tree: [] });
  for (const [repo, theme] of [
    ['default-theme', null], ['light-theme', 'light'], ['dark-theme', 'dark'],
    ['auto-theme', 'auto'], ['invalid-theme', 'invalid'],
  ]) {
    const query = new URLSearchParams({ username: 'test', repo });
    if (theme) query.set('theme', theme);
    const req = {
      method: 'GET',
      url: `/api?${query}`,
      headers: { host: 'localhost' },
    };
    const res = {
      writeHead(statusCode) { this.statusCode = statusCode; },
      end(body) { this.body = body; },
    };

    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.startsWith('<svg '), true);
    assert.equal(res.body.includes('prefers-color-scheme'), !['light', 'dark'].includes(theme));
    assert.match(res.body, theme === 'dark'
      ? /class="card-background"[^>]*fill="#0d1117"/
      : /class="card-background"[^>]*fill="#ffffff"/);
  }
});

test('serves the landing page and its preview with long CDN caching', async t => {
  const call = path => {
    const res = {
      writeHead(statusCode, headers) { this.statusCode = statusCode; this.headers = headers; },
      end(body) { this.body = body; },
    };
    return handler({ method: 'GET', url: path, headers: { host: 'localhost' } }, res).then(() => res);
  };

  const page = await call('/');
  assert.match(page.body, /<img src="\/preview\.svg"/);
  assert.match(page.headers['Cache-Control'], /s-maxage=86400/);

  mockGitHub(t, { TypeScript: 1 }, { tree: [] });
  const first = await call('/preview.svg');
  assert.equal(first.statusCode, 200);
  assert.match(first.headers['Cache-Control'], /s-maxage=86400/);
  assert.match(first.body, /prefers-color-scheme/);
});

test('uses the precision query parameter for small percentages', async t => {
  mockGitHub(t, { Main: 999, Tiny: 1 }, { tree: [] });
  const req = {
    method: 'GET',
    url: '/api?username=test&repo=precision&precision=2',
    headers: { host: 'localhost' },
  };
  const res = {
    writeHead(statusCode) { this.statusCode = statusCode; },
    end(body) { this.body = body; },
  };

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body, />0\.10%<\/text>/);
});

test('uses the native totals on an incomplete tree and retries on the next lookup', async t => {
  const fetch = mockGitHub(t, { Python: 13 }, { truncated: true, tree: [blob('main.umm', 19)] });
  const native = [{ language: 'Python', bytes: 13, percentage: 100 }];
  assert.deepEqual(await fetchLanguages('test', 'partial'), native);
  assert.deepEqual(await fetchLanguages('test', 'partial'), native);
  assert.equal(fetch.mock.callCount(), 4);
});

test('distinguishes missing tree access from an empty repository', async t => {
  const fetch = mockGitHub(t, {}, {}, 403);
  await assert.rejects(fetchLanguages('test', 'unavailable'), { statusCode: 502 });
  fetch.mock.restore();
  mockGitHub(t, {}, {}, 409);
  await assert.rejects(fetchLanguages('test', 'empty'), { statusCode: 404 });
});
