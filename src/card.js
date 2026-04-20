'use strict';

const { getColor } = require('./colors.js');

const THEMES = {
  light: {
    bg:           '#ffffff',
    border:       '#e4e2e2',
    titleColor:   '#2d333b',
    textColor:    '#636e7b',
    percentColor: '#2d333b',
  },
  dark: {
    bg:           '#0d1117',
    border:       '#30363d',
    titleColor:   '#e6edf3',
    textColor:    '#8b949e',
    percentColor: '#e6edf3',
  },
};

const MAX_LANGS = 10;
const WIDTH = 495;
const PADDING = 25;
const BAR_Y = 60;
const BAR_HEIGHT = 10;
const BAR_RADIUS = 5;
const LEGEND_TOP = 90;
const LEGEND_ROW_H = 25;
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function renderCard(languages, owner, repo, theme = 'light') {
  const t = THEMES[theme] || THEMES.light;

  let displayLangs = languages.slice(0, MAX_LANGS);
  if (languages.length > MAX_LANGS) {
    const otherPct = languages.slice(MAX_LANGS).reduce((s, l) => s + l.percentage, 0);
    displayLangs.push({ language: 'Other', percentage: otherPct, bytes: 0 });
  }

  const COLS = displayLangs.length > 5 ? 2 : 1;
  const ROWS = Math.ceil(displayLangs.length / COLS);
  const HEIGHT = LEGEND_TOP + ROWS * LEGEND_ROW_H + PADDING;
  const BAR_INNER_W = WIDTH - PADDING * 2;

  // Build stacked bar segments using cumulative float x
  let barX = PADDING;
  const barSegments = displayLangs.map(({ language, percentage }) => {
    const segW = (percentage / 100) * BAR_INNER_W;
    const x = barX;
    barX += segW;
    return `<rect x="${x.toFixed(2)}" y="${BAR_Y}" width="${segW.toFixed(2)}" height="${BAR_HEIGHT}" fill="${getColor(language)}" />`;
  });

  // Build legend items
  const colW = BAR_INNER_W / COLS;
  const legendItems = displayLangs.map(({ language, percentage }, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PADDING + col * colW;
    const y = LEGEND_TOP + row * LEGEND_ROW_H;
    const name = truncate(language, 22);
    return `<g transform="translate(${x},${y})">
      <circle cx="5" cy="5" r="5" fill="${getColor(language)}" />
      <text x="15" y="9.5" font-family="${FONT}" font-size="11" fill="${t.textColor}">${escapeXml(name)}</text>
      <text x="${(colW - 5).toFixed(1)}" y="9.5" text-anchor="end" font-family="${FONT}" font-size="11" font-weight="600" fill="${t.percentColor}">${percentage.toFixed(1)}%</text>
    </g>`;
  });

  const title = `${escapeXml(owner)}/${escapeXml(repo)} — Languages`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Language stats for ${escapeXml(owner)}/${escapeXml(repo)}">
  <defs>
    <clipPath id="bar-clip">
      <rect x="${PADDING}" y="${BAR_Y}" width="${BAR_INNER_W}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}" ry="${BAR_RADIUS}" />
    </clipPath>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="4.5" ry="4.5" fill="${t.bg}" stroke="${t.border}" stroke-width="1" />
  <text x="${PADDING}" y="38" font-family="${FONT}" font-size="15" font-weight="600" fill="${t.titleColor}">${title}</text>
  <g clip-path="url(#bar-clip)">
    ${barSegments.join('\n    ')}
  </g>
  ${legendItems.join('\n  ')}
</svg>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

module.exports = { renderCard };
