// Snippets en una API REST compatible con snippets-manager-backend (Express + MongoDB)
const axios = require('axios');
const { toSnippetFields } = require('./validate');

class ApiStore {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.http = axios.create({
      timeout: 15000,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async list() {
    const response = await this.http.get(this.baseUrl);
    if (!Array.isArray(response.data?.snippets)) {
      throw new Error('La respuesta de la API no contiene una lista de snippets');
    }
    return response.data.snippets;
  }

  // El backend ignora "rating" en POST y PUT: solo lo guarda PATCH /:id/rating
  async saveRating(snippet, rating) {
    if (rating === undefined || rating === (snippet.rating || 0)) {
      return snippet;
    }
    return this.setRating(snippet._id, rating);
  }

  async create(data) {
    const response = await this.http.post(this.baseUrl, toSnippetFields(data) || data);
    return this.saveRating(response.data.snippet, data.rating);
  }

  async update(id, data) {
    const response = await this.http.put(`${this.baseUrl}/${encodeURIComponent(id)}`, toSnippetFields(data) || data);
    return this.saveRating(response.data.snippet, data.rating);
  }

  async setRating(id, rating) {
    const response = await this.http.patch(`${this.baseUrl}/${encodeURIComponent(id)}/rating`, { rating });
    return response.data.snippet;
  }

  async remove(id) {
    await this.http.delete(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  // items ya validados por prepareImport. Una sola petición a POST /importar (conserva el rating);
  // si el backend no tiene ese endpoint (versiones antiguas, 404) se crean uno a uno.
  async importMany(items) {
    const payload = items.map(({ fecha: _fecha, ...item }) => item);
    try {
      const response = await this.http.post(`${this.baseUrl}/importar`, payload);
      return response.data.snippets.length;
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }
    let count = 0;
    for (const item of payload) {
      await this.create(item);
      count++;
    }
    return count;
  }
}

// Mensaje legible para los errores de axios (estado HTTP + texto del backend)
function describeError(error) {
  if (error.response) {
    if (error.response.status === 401) {
      return 'HTTP 401: el token de la API no es válido';
    }
    // El backend responde { msg } o texto plano
    const data = error.response.data;
    const body = typeof data === 'string' ? data : typeof data?.msg === 'string' ? data.msg : '';
    return `HTTP ${error.response.status}${body ? `: ${body.slice(0, 200)}` : ''}`;
  }
  if (error.code === 'ECONNABORTED') {
    return 'La API no ha respondido a tiempo';
  }
  return error.message;
}

module.exports = { ApiStore, describeError };
