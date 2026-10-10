const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

const API_URL = 'https://snippets-manager-service.vercel.app/api/snippets';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, 'assets/icons/icon.png'),
  });

  // La ventana solo muestra index.html: ni ventanas nuevas ni navegación (p. ej. al soltar un archivo)
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Abrir DevTools en modo desarrollo
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ============================================
// IPC Handlers para CRUD operations
// ============================================

// GET - Obtener todos los snippets
ipcMain.handle('get-snippets', async () => {
  try {
    const response = await axios.get(API_URL);
    return { success: true, data: response.data.snippets };
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return { success: false, error: error.message };
  }
});

// El backend ignora "rating" en POST y PUT: solo lo guarda PATCH /:id/rating
async function saveRating(snippet, rating) {
  if (rating === undefined || rating === (snippet.rating || 0)) {
    return snippet;
  }
  const response = await axios.patch(`${API_URL}/${snippet._id}/rating`, { rating });
  return response.data.snippet;
}

// POST - Crear nuevo snippet
ipcMain.handle('create-snippet', async (event, snippetData) => {
  try {
    const { rating, ...fields } = snippetData;
    const response = await axios.post(API_URL, fields);
    const snippet = await saveRating(response.data.snippet, rating);
    return { success: true, data: snippet };
  } catch (error) {
    console.error('Error creating snippet:', error);
    return { success: false, error: error.message };
  }
});

// PUT - Actualizar snippet
ipcMain.handle('update-snippet', async (event, id, snippetData) => {
  try {
    const { rating, ...fields } = snippetData;
    const response = await axios.put(`${API_URL}/${id}`, fields);
    const snippet = await saveRating(response.data.snippet, rating);
    return { success: true, data: snippet };
  } catch (error) {
    console.error('Error updating snippet:', error);
    return { success: false, error: error.message };
  }
});

// DELETE - Eliminar snippet
ipcMain.handle('delete-snippet', async (event, id) => {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting snippet:', error);
    return { success: false, error: error.message };
  }
});

// UPDATE - Rating
ipcMain.handle('update-rating', async (event, id, rating) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/rating`, { rating });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating rating:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// NUEVAS FUNCIONALIDADES: Import/Export
// ============================================

// EXPORT - Exportar snippets a archivo JSON
ipcMain.handle('export-snippets', async (event, snippets) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Snippets',
      defaultPath: `snippets-export-${Date.now()}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!filePath) {
      return { success: false, cancelled: true };
    }

    await fs.writeFile(filePath, JSON.stringify(snippets, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Error exporting snippets:', error);
    return { success: false, error: error.message };
  }
});

// IMPORT - Importar snippets desde archivo JSON
ipcMain.handle('import-snippets', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Importar Snippets',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (!filePaths || filePaths.length === 0) {
      return { success: false, cancelled: true };
    }

    const fileContent = await fs.readFile(filePaths[0], 'utf-8');
    const snippets = JSON.parse(fileContent);

    // Validar que sea un array
    if (!Array.isArray(snippets)) {
      throw new Error('El archivo no contiene un formato válido');
    }

    return { success: true, data: snippets };
  } catch (error) {
    console.error('Error importing snippets:', error);
    return { success: false, error: error.message };
  }
});

// EXPORT SINGLE - Exportar un snippet individual a archivo
ipcMain.handle('export-single-snippet', async (event, snippet) => {
  try {
    const extension = getFileExtension(snippet.language);
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar Snippet',
      defaultPath: `${sanitizeFilename(snippet.description)}.${extension}`,
      filters: [
        { name: `${snippet.language.toUpperCase()} Files`, extensions: [extension] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!filePath) {
      return { success: false, cancelled: true };
    }

    // Comentario con metadata al inicio del archivo (si el lenguaje admite comentarios)
    const content = buildExportContent(snippet);

    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Error exporting single snippet:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Extensión y estilo de comentario de la cabecera por lenguaje (valores de <select id="form-language">).
// header: null → sin cabecera (JSON no admite comentarios).
const BLOCK = { start: '/*', line: ' *', end: ' */' };
const HASH = { start: null, line: '#', end: null };
const SLASHES = { start: null, line: '//', end: null };
const MARKUP = { start: '<!--', line: '', end: '-->' };

const LANGUAGE_FILES = {
  javascript: { ext: 'js', header: BLOCK },
  typescript: { ext: 'ts', header: BLOCK },
  react: { ext: 'jsx', header: BLOCK },
  vue: { ext: 'vue', header: MARKUP },
  angular: { ext: 'ts', header: BLOCK },
  nodejs: { ext: 'js', header: BLOCK },
  python: { ext: 'py', header: { start: '"""', line: '', end: '"""' } },
  java: { ext: 'java', header: BLOCK },
  csharp: { ext: 'cs', header: BLOCK },
  cpp: { ext: 'cpp', header: BLOCK },
  php: { ext: 'php', header: BLOCK },
  ruby: { ext: 'rb', header: { start: '=begin', line: '', end: '=end' } },
  go: { ext: 'go', header: BLOCK },
  rust: { ext: 'rs', header: BLOCK },
  swift: { ext: 'swift', header: BLOCK },
  kotlin: { ext: 'kt', header: BLOCK },
  html: { ext: 'html', header: MARKUP },
  css: { ext: 'css', header: BLOCK },
  scss: { ext: 'scss', header: BLOCK },
  sass: { ext: 'sass', header: SLASHES },
  sql: { ext: 'sql', header: BLOCK },
  json: { ext: 'json', header: null },
  xml: { ext: 'xml', header: MARKUP },
  yaml: { ext: 'yml', header: HASH },
  markdown: { ext: 'md', header: MARKUP },
  bash: { ext: 'sh', header: HASH },
  powershell: { ext: 'ps1', header: HASH },
  git: { ext: 'txt', header: HASH },
  docker: { ext: 'dockerfile', header: HASH },
  http: { ext: 'http', header: HASH },
  graphql: { ext: 'graphql', header: HASH },
  regex: { ext: 'txt', header: HASH },
};

function getLanguageFile(language) {
  return LANGUAGE_FILES[String(language).toLowerCase()] || { ext: 'txt', header: HASH };
}

function getFileExtension(language) {
  return getLanguageFile(language).ext;
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function generateFileHeader(snippet) {
  const style = getLanguageFile(snippet.language).header;
  if (!style) {
    return '';
  }
  const date = new Date(snippet.fecha).toLocaleDateString();
  const rating = Math.min(5, Math.max(0, Math.round(snippet.rating || 0)));
  const lines = [
    `Snippet: ${snippet.description}`,
    `Language: ${snippet.language}`,
    `Rating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
    `Date: ${date}`,
  ].map(text => `${style.line} ${text}`);

  return [style.start, ...lines, style.end].filter(line => line !== null).join('\n') + '\n\n';
}

// La declaración <?xml ...?> y el shebang (#!) tienen que ser la primera línea: la cabecera va detrás
function buildExportContent(snippet) {
  const header = generateFileHeader(snippet);
  const declaration = snippet.code.match(/^\s*(<\?xml[^>]*\?>|#![^\r\n]*)\r?\n?/);
  if (declaration) {
    return declaration[0].trimStart().replace(/\r?\n?$/, '\n') + header + snippet.code.slice(declaration[0].length);
  }
  return header + snippet.code;
}
