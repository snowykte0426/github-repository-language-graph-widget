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
