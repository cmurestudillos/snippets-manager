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

  // Leer snippets de un archivo JSON (devuelve los válidos y cuántos se descartan)
  importSnippets: () => ipcRenderer.invoke('import-snippets'),

  // Guardar en el almacenamiento actual los snippets leídos con importSnippets
  importBatch: items => ipcRenderer.invoke('import-batch', items),

  // Exportar un snippet individual a archivo
  exportSingleSnippet: snippet => ipcRenderer.invoke('export-single-snippet', snippet),

  // ========== Ajustes ==========

  // { storage: 'local' | 'api', apiUrl, localFile, version }
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: settings => ipcRenderer.invoke('save-settings', settings),
  testApi: apiUrl => ipcRenderer.invoke('test-api', apiUrl),
  showDataFile: () => ipcRenderer.invoke('show-data-file'),

  // Avisar al proceso principal de cambios sin guardar (pregunta antes de cerrar la ventana)
  setUnsavedChanges: value => ipcRenderer.send('set-unsaved-changes', value),
});
