const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs de forma segura al proceso de renderizado
contextBridge.exposeInMainWorld('api', {
  // ========== CRUD Operations ==========

  // Obtener todos los snippets
  getSnippets: () => ipcRenderer.invoke('get-snippets'),

  // Crear nuevo snippet
  createSnippet: snippetData => ipcRenderer.invoke('create-snippet', snippetData),

  // Actualizar snippet existente
  updateSnippet: (id, snippetData) => ipcRenderer.invoke('update-snippet', id, snippetData),

  // Eliminar snippet
  deleteSnippet: id => ipcRenderer.invoke('delete-snippet', id),

  // Actualizar rating
  updateRating: (id, rating) => ipcRenderer.invoke('update-rating', id, rating),

  // ========== Import/Export Operations ==========

  // Exportar todos los snippets a JSON
  exportSnippets: snippets => ipcRenderer.invoke('export-snippets', snippets),

  // Importar snippets desde JSON
  importSnippets: () => ipcRenderer.invoke('import-snippets'),

  // Exportar un snippet individual a archivo
  exportSingleSnippet: snippet => ipcRenderer.invoke('export-single-snippet', snippet),
});
