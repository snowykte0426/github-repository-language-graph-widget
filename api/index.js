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

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (!urlObj.pathname.startsWith('/api')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(landingPage());
    return;
  }

  const username  = (urlObj.searchParams.get('username') || '').trim();
  const repo      = (urlObj.searchParams.get('repo')     || '').trim();
  const theme     = urlObj.searchParams.get('theme') || 'light';
  const langsRaw  = urlObj.searchParams.get('langs_count');
  const langsCount = langsRaw ? Math.min(Math.max(1, parseInt(langsRaw, 10) || 20), 100) : 20;

  if (!username || !repo) {
    return sendError(res, 400, 'Missing required query parameters: username, repo');
  }
  if (!SAFE_NAME.test(username) || !SAFE_NAME.test(repo)) {
    return sendError(res, 400, 'Invalid username or repo name');
  }

  const resolvedTheme = ALLOWED_THEMES.has(theme) ? theme : 'light';

  try {
    const languages = await fetchLanguages(username, repo);
    const svg = renderCard(languages, username, repo, resolvedTheme, langsCount);

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

function landingPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GitHub Repository Language Graph</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
    }
    .container { width: 100%; max-width: 680px; }
    h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: #8b949e; font-size: 15px; margin-bottom: 48px; }
    h2 { font-size: 14px; font-weight: 600; color: #8b949e; text-transform: uppercase;
         letter-spacing: .06em; margin-bottom: 12px; }
    .section { margin-bottom: 40px; }
    .preview { background: #161b22; border: 1px solid #30363d; border-radius: 6px;
               padding: 24px; text-align: center; margin-bottom: 40px; }
    .preview img { max-width: 100%; height: auto; }
    code, pre {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 13px;
    }
    .code-block {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px 20px;
      overflow-x: auto;
      margin-bottom: 16px;
      color: #79c0ff;
      white-space: pre;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #21262d; }
    th { color: #8b949e; font-weight: 600; }
    td:first-child { color: #79c0ff; font-family: 'SFMono-Regular', monospace; }
    td:nth-child(2) { color: #a5d6ff; }
    .badge { display: inline-block; background: #21262d; border: 1px solid #30363d;
             border-radius: 4px; padding: 2px 8px; font-size: 12px; color: #8b949e;
             font-family: monospace; }
    .footer { margin-top: 64px; color: #484f58; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>GitHub Repository Language Graph</h1>
    <p class="subtitle">SVG language statistics widget for a specific GitHub repository — embed in any README.</p>

    <div class="preview">
      <img src="/api?username=vercel&repo=next.js&theme=dark" alt="Language stats for vercel/next.js" />
    </div>

    <div class="section">
      <h2>Usage</h2>
      <div class="code-block">/api?username={owner}&amp;repo={repo}</div>
      <p style="color:#8b949e;font-size:13px;">Embed in your README:</p>
      <div class="code-block" style="color:#a5d6ff;">![Language Stats](https://your-domain.vercel.app/api?username=owner&amp;repo=repo)</div>
    </div>

    <div class="section">
      <h2>Parameters</h2>
      <table>
        <thead><tr><th>Parameter</th><th>Description</th><th>Default</th></tr></thead>
        <tbody>
          <tr><td>username</td><td>Repository owner (required)</td><td>—</td></tr>
          <tr><td>repo</td><td>Repository name (required)</td><td>—</td></tr>
          <tr><td>theme</td><td><span class="badge">light</span> or <span class="badge">dark</span></td><td>light</td></tr>
          <tr><td>langs_count</td><td>Number of languages to display (max 100, rest grouped as Other)</td><td>20</td></tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Examples</h2>
      <div class="code-block">/api?username=torvalds&amp;repo=linux&amp;theme=dark
/api?username=microsoft&amp;repo=vscode&amp;theme=light&amp;langs_count=5</div>
    </div>

    <div class="footer">MIT License · <a href="https://github.com/snowykte0426/github-repository-language-graph" style="color:#484f58;">snowykte0426</a></div>
  </div>
</body>
</html>`;
}
