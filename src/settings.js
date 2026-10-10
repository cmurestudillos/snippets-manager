// Ajustes de la app en userData/settings.json: dónde se guardan los snippets
const fs = require('fs').promises;

const DEFAULTS = { storage: 'local', apiUrl: '' };

function isValidApiUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalize(settings) {
  const apiUrl = typeof settings?.apiUrl === 'string' ? settings.apiUrl.trim() : '';
  const storage = settings?.storage === 'api' && isValidApiUrl(apiUrl) ? 'api' : 'local';
  return { storage, apiUrl };
}

async function loadSettings(filePath) {
  try {
    return normalize(JSON.parse(await fs.readFile(filePath, 'utf-8')));
  } catch {
    return { ...DEFAULTS };
  }
}

async function saveSettings(filePath, settings) {
  const normalized = normalize(settings);
  await fs.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

module.exports = { loadSettings, saveSettings, isValidApiUrl };
