'use strict';

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map();

async function fetchLanguages(owner, repo) {
  const cacheKey = `${owner}/${repo}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'github-repository-language-graph/1.0',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const err = new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    err.statusCode = res.status === 404 ? 404 : 502;
    throw err;
  }

  const raw = await res.json();
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

  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

module.exports = { fetchLanguages };
