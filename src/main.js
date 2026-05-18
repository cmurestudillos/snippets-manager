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

// POST - Crear nuevo snippet
ipcMain.handle('create-snippet', async (event, snippetData) => {
  try {
    const response = await axios.post(API_URL, snippetData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creating snippet:', error);
    return { success: false, error: error.message };
  }
});

// PUT - Actualizar snippet
ipcMain.handle('update-snippet', async (event, id, snippetData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, snippetData);
    return { success: true, data: response.data };
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

    // Agregar comentario con metadata al inicio del archivo
    const header = generateFileHeader(snippet);
    const content = header + snippet.code;

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

function getFileExtension(language) {
  const extensions = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    css: 'css',
    html: 'html',
    sql: 'sql',
    bash: 'sh',
    git: 'txt',
    http: 'http',
    json: 'json',
    markdown: 'md',
    php: 'php',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    vue: 'vue',
    react: 'jsx',
    angular: 'ts',
  };
  return extensions[language.toLowerCase()] || 'txt';
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function generateFileHeader(snippet) {
  const commentStyle = getCommentStyle(snippet.language);
  const date = new Date(snippet.fecha).toLocaleDateString();

  return `${commentStyle.start}
${commentStyle.line} Snippet: ${snippet.description}
${commentStyle.line} Language: ${snippet.language}
${commentStyle.line} Rating: ${'★'.repeat(snippet.rating || 0)}${'☆'.repeat(5 - (snippet.rating || 0))}
${commentStyle.line} Date: ${date}
${commentStyle.end}

`;
}

function getCommentStyle(language) {
  const styles = {
    javascript: { start: '/*', line: ' *', end: ' */' },
    typescript: { start: '/*', line: ' *', end: ' */' },
    python: { start: '"""', line: '', end: '"""' },
    java: { start: '/*', line: ' *', end: ' */' },
    css: { start: '/*', line: ' *', end: ' */' },
    html: { start: '<!--', line: '', end: '-->' },
    sql: { start: '/*', line: ' *', end: ' */' },
    bash: { start: '#', line: '#', end: '' },
    php: { start: '/*', line: ' *', end: ' */' },
    ruby: { start: '=begin', line: '', end: '=end' },
    go: { start: '/*', line: ' *', end: ' */' },
    rust: { start: '/*', line: ' *', end: ' */' },
    vue: { start: '<!--', line: '', end: '-->' },
    react: { start: '/*', line: ' *', end: ' */' },
    angular: { start: '/*', line: ' *', end: ' */' },
  };

  return styles[language.toLowerCase()] || { start: '/*', line: ' *', end: ' */' };
}
