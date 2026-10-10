// Snippets guardados en un archivo JSON local (userData/snippets.json). No necesita red.
const fs = require('fs').promises;
const crypto = require('crypto');
const { clampRating, toSnippetFields } = require('./validate');

class LocalStore {
  constructor(filePath) {
    this.filePath = filePath;
    // Las escrituras se encadenan para que dos cambios seguidos no se pisen
    this.queue = Promise.resolve();
  }

  async read() {
    let text;
    try {
      text = await fs.readFile(this.filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
    // Si el archivo está dañado no se sobrescribe: se avisa y se deja como está
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`El archivo ${this.filePath} no es un JSON válido`);
    }
    if (!Array.isArray(data)) {
      throw new Error(`El archivo ${this.filePath} no contiene una lista de snippets`);
    }
    return data;
  }

  async write(snippets) {
    const tmp = `${this.filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(snippets, null, 2), 'utf-8');
    await fs.rename(tmp, this.filePath);
  }

  change(mutator) {
    const run = this.queue.then(async () => {
      const snippets = await this.read();
      const result = mutator(snippets);
      await this.write(snippets);
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }

  async list() {
    await this.queue;
    const snippets = await this.read();
    // Mismo orden que el backend (lenguaje descendente) para que ambos modos se vean igual
    return snippets.sort((a, b) => String(b.language).localeCompare(String(a.language)));
  }

  create(data) {
    const fields = toSnippetFields(data);
    if (!fields) {
      return Promise.reject(new Error('Descripción, lenguaje y código son obligatorios'));
    }
    return this.change(snippets => {
      const snippet = {
        _id: crypto.randomUUID(),
        ...fields,
        rating: clampRating(data.rating),
        fecha: new Date().toISOString(),
      };
      snippets.push(snippet);
      return snippet;
    });
  }

  update(id, data) {
    const fields = toSnippetFields(data);
    if (!fields) {
      return Promise.reject(new Error('Descripción, lenguaje y código son obligatorios'));
    }
    return this.change(snippets => {
      const snippet = findOrThrow(snippets, id);
      Object.assign(snippet, fields);
      if (data.rating !== undefined) {
        snippet.rating = clampRating(data.rating);
      }
      return snippet;
    });
  }

  setRating(id, rating) {
    return this.change(snippets => {
      const snippet = findOrThrow(snippets, id);
      snippet.rating = clampRating(rating);
      return snippet;
    });
  }

  remove(id) {
    return this.change(snippets => {
      snippets.splice(snippets.indexOf(findOrThrow(snippets, id)), 1);
    });
  }

  // items ya validados por prepareImport
  importMany(items) {
    return this.change(snippets => {
      const now = new Date().toISOString();
      const created = items.map(item => ({ _id: crypto.randomUUID(), ...item, fecha: item.fecha || now }));
      snippets.push(...created);
      return created.length;
    });
  }
}

function findOrThrow(snippets, id) {
  const snippet = snippets.find(s => s._id === id);
  if (!snippet) {
    throw new Error('Snippet no encontrado');
  }
  return snippet;
}

module.exports = { LocalStore };
