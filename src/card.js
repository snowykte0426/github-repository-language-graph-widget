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

const HARD_MAX   = 100;
const DEFAULT_W  = 495;
const MIN_W      = 300;
const MAX_W      = 1000;
const PADDING    = 25;
const BAR_Y      = 60;
const BAR_HEIGHT = 10;
const BAR_RADIUS = 5;
const LEGEND_TOP = 90;
const LEGEND_ROW_H = 25;
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

// Approximate px-per-character for a given font-size (good enough for SVG layout)
const CHAR_W = { 11: 6.2, 13: 7.3, 15: 8.5 };

function renderCard(languages, owner, repo, theme = 'light', langsCount = 20, cardWidth = DEFAULT_W) {
  const t = THEMES[theme] || THEMES.light;
  const limit = Math.min(Math.max(1, langsCount), HARD_MAX);
  const W = Math.min(Math.max(cardWidth, MIN_W), MAX_W);

  let displayLangs = languages.slice(0, limit);
  if (languages.length > limit) {
    const otherPct = languages.slice(limit).reduce((s, l) => s + l.percentage, 0);
    displayLangs.push({ language: 'Other', percentage: otherPct, bytes: 0 });
  }

  const innerW = W - PADDING * 2;

  // Scale title font size: shrink for narrow cards
  const titleFontSize = W >= 450 ? 15 : W >= 380 ? 13 : 11;
  // Max chars for title: available width minus some padding, divided by char width
  const titleMaxChars = Math.floor((innerW - 10) / CHAR_W[titleFontSize]);
  const rawTitle = `${owner}/${repo} — Languages`;
  const titleText = escapeXml(truncate(rawTitle, titleMaxChars));

  // Two columns only if card is wide enough and there are enough languages
  const COLS = (W >= 420 && displayLangs.length > 5) ? 2 : 1;
  const ROWS = Math.ceil(displayLangs.length / COLS);
  const HEIGHT = LEGEND_TOP + ROWS * LEGEND_ROW_H + PADDING;
  const colW = innerW / COLS;

  // Max chars for language name: colW minus dot(10px) minus percent(~45px) minus gap(10px)
  const nameAvailW = colW - 10 - 45 - 10;
  const nameMaxChars = Math.max(6, Math.floor(nameAvailW / CHAR_W[11]));

  // Stacked bar segments
  let barX = PADDING;
  const barSegments = displayLangs.map(({ language, percentage }) => {
    const segW = (percentage / 100) * innerW;
    const x = barX;
    barX += segW;
    return `<rect x="${x.toFixed(2)}" y="${BAR_Y}" width="${segW.toFixed(2)}" height="${BAR_HEIGHT}" fill="${getColor(language)}" />`;
  });

  // Legend items
  const legendItems = displayLangs.map(({ language, percentage }, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PADDING + col * colW;
    const y = LEGEND_TOP + row * LEGEND_ROW_H;
    const name = escapeXml(truncate(language, nameMaxChars));
    return `<g transform="translate(${x},${y})">
      <circle cx="5" cy="5" r="5" fill="${getColor(language)}" />
      <text x="15" y="9.5" font-family="${FONT}" font-size="11" fill="${t.textColor}">${name}</text>
      <text x="${(colW - 5).toFixed(1)}" y="9.5" text-anchor="end" font-family="${FONT}" font-size="11" font-weight="600" fill="${t.percentColor}">${percentage.toFixed(1)}%</text>
    </g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HEIGHT}" viewBox="0 0 ${W} ${HEIGHT}" role="img" aria-label="Language stats for ${escapeXml(owner)}/${escapeXml(repo)}">
  <defs>
    <clipPath id="bar-clip">
      <rect x="${PADDING}" y="${BAR_Y}" width="${innerW}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}" ry="${BAR_RADIUS}" />
    </clipPath>
  </defs>
  <rect width="${W}" height="${HEIGHT}" rx="4.5" ry="4.5" fill="${t.bg}" stroke="${t.border}" stroke-width="1" />
  <text x="${PADDING}" y="38" font-family="${FONT}" font-size="${titleFontSize}" font-weight="600" fill="${t.titleColor}">${titleText}</text>
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
