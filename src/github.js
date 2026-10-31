'use strict';

const { extname } = require('node:path').posix;
const { getDisplayName } = require('./colors');
const supplemental = require('./data/supplemental-colors.json');

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();
const extraLanguages = Object.entries(supplemental).filter(([, token]) => token.extensions);

async function fetchExtraBytes(repoUrl, headers, reported) {
  const byExtension = new Map();
  for (const [name, token] of extraLanguages) {
    if (Object.hasOwn(reported, name)) continue;
    for (const ext of token.extensions) byExtension.set(ext, name);
  }
  if (!byExtension.size) return {};

  const res = await fetch(`${repoUrl}/git/trees/HEAD?recursive=1`, {
    headers, signal: AbortSignal.timeout(5000),
  });
  if (res.status === 409) return {}; // An empty repository has no HEAD tree.
  if (!res.ok) throw new Error(`GitHub file tree unavailable (HTTP ${res.status})`);
  const { tree, truncated } = await res.json();
  if (truncated) throw new Error('GitHub returned an incomplete file tree');

  const bytes = Object.create(null);
  for (const file of tree) {
    if (file.type !== 'blob' || !['100644', '100755'].includes(file.mode) || !(file.size > 0)) continue;
    const language = byExtension.get(extname(file.path).toLowerCase());
    if (language) bytes[language] = (bytes[language] || 0) + file.size;
  }
  return bytes;
}

async function fetchLanguages(owner, repo) {
  const cacheKey = `${owner}/${repo}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const repoUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'github-repository-language-graph/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`${repoUrl}/languages`, { headers });

  if (!res.ok) {
    const err = new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    err.statusCode = res.status === 404 ? 404 : 502;
    throw err;
  }

  const raw = Object.create(null);
  for (const [language, bytes] of Object.entries(await res.json())) {
    const name = getDisplayName(language);
    raw[name] = (raw[name] || 0) + bytes;
  }
  let complete = true;
  try {
    Object.assign(raw, await fetchExtraBytes(repoUrl, headers, raw));
  } catch (error) {
    if (!Object.keys(raw).length) {
      const err = new Error('Unable to get a complete GitHub file tree for language detection', { cause: error });
      err.statusCode = 502;
      throw err;
    }
    complete = false;
  }
  const totalBytes = Object.values(raw).reduce((s, n) => s + n, 0);

  if (totalBytes === 0) {
    const err = new Error('Repository has no detectable language data');
    err.statusCode = 404;
    throw err;
  }

  const data = Object.entries(raw)
    .sort(([, a], [, b]) => b - a)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: (bytes / totalBytes) * 100,
    }));

  if (complete) cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

module.exports = { fetchLanguages };
