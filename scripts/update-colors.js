'use strict';

const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const { parse } = require('yaml');

const REPOSITORY = 'github-linguist/linguist';
const SOURCE_PATH = 'lib/linguist/languages.yml';
const ROOT = path.resolve(__dirname, '..');

async function download(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'github-repository-language-graph' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
  return response.text();
}

async function main() {
  // Accept a pinned commit to reproduce a snapshot, or find the latest change.
  let revision = process.argv[2];
  if (!revision) {
    const commits = JSON.parse(await download(
      `https://api.github.com/repos/${REPOSITORY}/commits?path=${SOURCE_PATH}&per_page=1`,
    ));
    revision = commits[0]?.sha;
  }
  if (!/^[a-f0-9]{40}$/.test(revision || '')) {
    throw new Error('Expected a full 40-character Linguist commit SHA.');
  }

  const base = `https://raw.githubusercontent.com/${REPOSITORY}/${revision}`;
  const source = `${base}/${SOURCE_PATH}`;
  const [yaml, license] = await Promise.all([
    download(source),
    download(`${base}/LICENSE`),
  ]);
  const languages = parse(yaml);
  if (!languages || typeof languages !== 'object' || Array.isArray(languages)) {
    throw new Error('Expected a Linguist language mapping.');
  }

  const colors = Object.create(null);
  const aliases = Object.create(null);
  const groups = Object.create(null);
  const names = new Map(Object.keys(languages).map(name => [name.toLowerCase(), name]));

  for (const [name, data] of Object.entries(languages)) {
    if (data.color !== undefined && !/^#[a-f0-9]{6}$/i.test(data.color)) {
      throw new Error(`Invalid color for ${name}: ${data.color}`);
    }
    colors[name] = data.color || null;
    for (const alias of data.aliases || []) {
      const key = alias.toLowerCase();
      if (names.has(key) && names.get(key) !== name) {
        throw new Error(`Ambiguous alias: ${alias}`);
      }
      names.set(key, name);
      aliases[alias] = name;
    }
    // Linguist sometimes explicitly marks a group root as its own parent.
    if (data.group && data.group !== name) {
      if (!Object.hasOwn(languages, data.group)) {
        throw new Error(`Unknown group for ${name}: ${data.group}`);
      }
      groups[name] = data.group;
    }
  }

  if (Object.keys(colors).length === 0) throw new Error('Empty language mapping.');
  for (const name of Object.keys(groups)) {
    const seen = new Set();
    for (let current = name; Object.hasOwn(groups, current); current = groups[current]) {
      if (seen.has(current)) throw new Error(`Cyclic language group: ${name}`);
      seen.add(current);
    }
  }

  const snapshot = { source, revision, colors, aliases, groups };
  const dataDirectory = path.join(ROOT, 'src/data');
  const licenseDirectory = path.join(ROOT, 'LICENSES');
  await mkdir(dataDirectory, { recursive: true });
  await mkdir(licenseDirectory, { recursive: true });
  await writeFile(path.join(licenseDirectory, 'github-linguist.txt'), license);
  await writeFile(path.join(dataDirectory, 'linguist-colors.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
  const colored = Object.values(colors).filter(Boolean).length;
  console.log(`Updated ${colored} Linguist colors across ${Object.keys(colors).length} languages (${revision}).`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
