// Normalización de snippets compartida por los dos almacenamientos (local y API)

const isFilled = value => typeof value === 'string' && value.trim() !== '';

function clampRating(rating) {
  const value = Math.round(Number(rating));
  return Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
}

// Campos editables de un snippet; devuelve null si falta alguno obligatorio
function toSnippetFields(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const { description, language, code } = data;
  if (!isFilled(description) || !isFilled(language) || !isFilled(code)) {
    return null;
  }
  return { description: description.trim(), language: language.trim(), code };
}

// Snippets de un archivo de importación: separa los válidos de los descartados
function prepareImport(items) {
  const valid = [];
  let skipped = 0;
  for (const item of Array.isArray(items) ? items : []) {
    const fields = toSnippetFields(item);
    if (!fields) {
      skipped++;
      continue;
    }
    const fecha = item.fecha && !Number.isNaN(Date.parse(item.fecha)) ? new Date(item.fecha).toISOString() : null;
    valid.push({ ...fields, rating: clampRating(item.rating), fecha });
  }
  return { valid, skipped };
}

module.exports = { clampRating, toSnippetFields, prepareImport };
