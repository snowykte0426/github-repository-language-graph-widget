'use strict';

const { fetchLanguages } = require('../src/github.js');
const { renderCard }     = require('../src/card.js');

const SAFE_NAME     = /^[a-zA-Z0-9_.\-]+$/;
const ALLOWED_THEMES = new Set(['light', 'dark']);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const urlObj  = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const username = (urlObj.searchParams.get('username') || '').trim();
  const repo     = (urlObj.searchParams.get('repo')     || '').trim();
  const theme    = urlObj.searchParams.get('theme') || 'light';

  if (!username || !repo) {
    return sendError(res, 400, 'Missing required query parameters: username, repo');
  }
  if (!SAFE_NAME.test(username) || !SAFE_NAME.test(repo)) {
    return sendError(res, 400, 'Invalid username or repo name');
  }

  const resolvedTheme = ALLOWED_THEMES.has(theme) ? theme : 'light';

  try {
    const languages = await fetchLanguages(username, repo);
    const svg = renderCard(languages, username, repo, resolvedTheme);

    res.writeHead(200, {
      'Content-Type':           'image/svg+xml',
      'Cache-Control':          'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(svg);
  } catch (err) {
    sendError(res, err.statusCode || 500, err.message);
  }
};

function sendError(res, code, message) {
  const safe = escapeXml(String(message));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="80" viewBox="0 0 495 80">
  <rect width="495" height="80" rx="4.5" fill="#0d1117" stroke="#30363d" stroke-width="1"/>
  <text x="25" y="28" font-family="sans-serif" font-size="14" font-weight="600" fill="#f85149">Error ${code}</text>
  <text x="25" y="52" font-family="sans-serif" font-size="12" fill="#8b949e">${safe}</text>
</svg>`;
  res.writeHead(code, { 'Content-Type': 'image/svg+xml' });
  res.end(svg);
}

function escapeXml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
