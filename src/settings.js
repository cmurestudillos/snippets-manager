// Ajustes de la app en userData/settings.json: dónde se guardan los snippets
const fs = require('fs').promises;
const { safeStorage } = require('electron');

const DEFAULTS = { storage: 'local', apiUrl: '', apiToken: '' };

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
  const apiToken = typeof settings?.apiToken === 'string' ? settings.apiToken.trim() : '';
  const storage = settings?.storage === 'api' && isValidApiUrl(apiUrl) ? 'api' : 'local';
  return { storage, apiUrl, apiToken };
}

// El token se guarda cifrado con el llavero del sistema (DPAPI, Keychain, libsecret) si está disponible
function encryptToken(token) {
  if (!token || !safeStorage.isEncryptionAvailable()) {
    return { apiToken: token };
  }
  return { apiTokenEncrypted: safeStorage.encryptString(token).toString('base64') };
}

function decryptToken(saved) {
  if (typeof saved.apiTokenEncrypted !== 'string') {
    return saved.apiToken;
  }
  try {
    return safeStorage.decryptString(Buffer.from(saved.apiTokenEncrypted, 'base64'));
  } catch {
    return '';
  }
}

async function loadSettings(filePath) {
  try {
    const saved = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    return normalize({ ...saved, apiToken: decryptToken(saved) });
  } catch {
    return { ...DEFAULTS };
  }
}

async function saveSettings(filePath, settings) {
  const { apiToken, ...normalized } = normalize(settings);
  const stored = { ...normalized, ...encryptToken(apiToken) };
  await fs.writeFile(filePath, JSON.stringify(stored, null, 2), 'utf-8');
  return { ...normalized, apiToken };
}

module.exports = { loadSettings, saveSettings, isValidApiUrl };
