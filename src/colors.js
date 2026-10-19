'use strict';

const linguist = require('./data/linguist-colors.json');
const supplemental = require('./data/supplemental-colors.json');

const DEFAULT_COLOR = '#8b949e';
const LANGUAGE_COLORS = Object.create(null);
const languageNames = new Map();

function resolveColor(language, seen = new Set()) {
  if (seen.has(language)) return DEFAULT_COLOR;
  seen.add(language);

  // An upstream color always takes precedence over a local supplement.
  if (Object.hasOwn(linguist.colors, language) && linguist.colors[language]) {
    return linguist.colors[language];
  }
  if (Object.hasOwn(supplemental, language)) {
    const token = supplemental[language];
    if (token.color) return token.color;
    if (token.language) return resolveColor(token.language, seen);
  }
  if (Object.hasOwn(linguist.groups, language)) {
    return resolveColor(linguist.groups[language], seen);
  }
  return DEFAULT_COLOR;
}

const languages = new Set([...Object.keys(linguist.colors), ...Object.keys(supplemental)]);
for (const language of languages) {
  LANGUAGE_COLORS[language] = resolveColor(language);
  languageNames.set(language.toLowerCase(), language);
}

for (const [alias, language] of Object.entries(linguist.aliases)) {
  languageNames.set(alias.toLowerCase(), language);
}

// Preserve the existing public mapping as well as Linguist's lowercase alias.
LANGUAGE_COLORS.Terraform = LANGUAGE_COLORS.HCL;
LANGUAGE_COLORS.Other = DEFAULT_COLOR;
Object.freeze(LANGUAGE_COLORS);

function getColor(language) {
  if (typeof language !== 'string') return DEFAULT_COLOR;
  const canonical = languageNames.get(language.trim().toLowerCase());
  return canonical ? LANGUAGE_COLORS[canonical] : DEFAULT_COLOR;
}

module.exports = { LANGUAGE_COLORS, DEFAULT_COLOR, getColor };
