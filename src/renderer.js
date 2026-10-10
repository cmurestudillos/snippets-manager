// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
let snippets = [];
let filteredSnippets = [];
let selectedSnippet = null;
let editingSnippet = null;
let currentRating = 0;
let currentTheme = 'dark';

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const elements = {
  snippetsList: document.getElementById('snippets-list'),
  searchInput: document.getElementById('search-input'),
  languageFilter: document.getElementById('language-filter'),
  snippetCount: document.getElementById('snippet-count'),

  // Botones principales
  newSnippetBtn: document.getElementById('new-snippet-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  importBtn: document.getElementById('import-btn'),
  exportBtn: document.getElementById('export-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  emptyImportBtn: document.getElementById('empty-import-btn'),

  // Vistas
  emptyState: document.getElementById('empty-state'),
  snippetView: document.getElementById('snippet-view'),
  editView: document.getElementById('edit-view'),

  // Vista de snippet
  snippetDescription: document.getElementById('snippet-description'),
  snippetLanguage: document.getElementById('snippet-language'),
  snippetCode: document.getElementById('snippet-code'),
  snippetDate: document.getElementById('snippet-date'),
  starsDisplay: document.getElementById('stars-display'),
  editBtn: document.getElementById('edit-btn'),
  deleteBtn: document.getElementById('delete-btn'),
  copyBtn: document.getElementById('copy-btn'),
  exportSingleBtn: document.getElementById('export-single-btn'),
  codeLanguageLabel: document.getElementById('code-language-label'),

  // Vista de edición
  editTitle: document.getElementById('edit-title'),
  snippetForm: document.getElementById('snippet-form'),
  formDescription: document.getElementById('form-description'),
  formLanguage: document.getElementById('form-language'),
  formCode: document.getElementById('form-code'),
  formRating: document.getElementById('form-rating'),
  starsInput: document.getElementById('stars-input'),
  saveBtn: document.getElementById('save-btn'),
  cancelBtn: document.getElementById('cancel-btn'),

  toastContainer: document.getElementById('toast-container'),

  // Temas de highlight.js
  hljsDark: document.getElementById('hljs-dark'),
  hljsLight: document.getElementById('hljs-light'),
};

// ============================================
// INICIALIZACIÓN
// ============================================
async function init() {
  loadThemePreference();
  await loadSettings();
  await loadSnippets();
  setupEventListeners();
  setupSettingsListeners();
  setupShortcuts();
  populateLanguageFilter();
}

// ============================================
// GESTIÓN DE TEMAS
// ============================================
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  // Cambiar tema de highlight.js
  if (theme === 'dark') {
    elements.hljsDark.disabled = false;
    elements.hljsLight.disabled = true;
    elements.themeToggleBtn.textContent = '☀️';
    elements.themeToggleBtn.title = 'Cambiar a tema claro';
  } else {
    elements.hljsDark.disabled = true;
    elements.hljsLight.disabled = false;
    elements.themeToggleBtn.textContent = '🌙';
    elements.themeToggleBtn.title = 'Cambiar a tema oscuro';
  }

  // Re-aplicar highlighting si hay un snippet seleccionado
  if (selectedSnippet) {
    highlightCode(selectedSnippet.code, selectedSnippet.language);
  }
}

function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  showToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
}

// ============================================
// AJUSTES: ALMACENAMIENTO LOCAL O API
// ============================================
const settingsElements = {
  button: document.getElementById('settings-btn'),
  modal: document.getElementById('settings-modal'),
  storageBadge: document.getElementById('storage-badge'),
  radios: document.querySelectorAll('input[name="storage"]'),
  localDetail: document.getElementById('local-detail'),
  localFilePath: document.getElementById('local-file-path'),
  showDataFileBtn: document.getElementById('show-data-file-btn'),
  apiDetail: document.getElementById('api-detail'),
  apiUrlInput: document.getElementById('api-url-input'),
  testApiBtn: document.getElementById('test-api-btn'),
  apiTestResult: document.getElementById('api-test-result'),
  appVersion: document.getElementById('app-version'),
  cancelBtn: document.getElementById('settings-cancel-btn'),
  saveBtn: document.getElementById('settings-save-btn'),
};

let currentSettings = { storage: 'local', apiUrl: '' };

function renderStorageBadge() {
  const isApi = currentSettings.storage === 'api';
  settingsElements.storageBadge.textContent = isApi ? '☁️ API' : '💻 Local';
  settingsElements.storageBadge.title = isApi
    ? `Guardados en la API: ${currentSettings.apiUrl}`
    : 'Guardados en este equipo';
}

async function loadSettings() {
  currentSettings = await window.api.getSettings();
  renderStorageBadge();
}

function selectedStorage() {
  return [...settingsElements.radios].find(radio => radio.checked)?.value || 'local';
}

function updateStorageDetails() {
  const storage = selectedStorage();
  settingsElements.localDetail.hidden = storage !== 'local';
  settingsElements.apiDetail.hidden = storage !== 'api';
}

async function openSettings() {
  await loadSettings();
  settingsElements.radios.forEach(radio => {
    radio.checked = radio.value === currentSettings.storage;
  });
  settingsElements.apiUrlInput.value = currentSettings.apiUrl;
  settingsElements.localFilePath.textContent = currentSettings.localFile;
  settingsElements.appVersion.textContent = `Snippets Manager Pro v${currentSettings.version}`;
  settingsElements.apiTestResult.textContent = '';
  settingsElements.apiTestResult.className = 'api-test-result';
  updateStorageDetails();
  settingsElements.modal.hidden = false;
  settingsElements.saveBtn.focus();
}

function closeSettings() {
  settingsElements.modal.hidden = true;
  settingsElements.button.focus();
}

async function testApiConnection() {
  const result = settingsElements.apiTestResult;
  result.className = 'api-test-result';
  result.textContent = 'Conectando...';
  const response = await window.api.testApi(settingsElements.apiUrlInput.value.trim());
  if (response.success) {
    result.classList.add('ok');
    result.textContent = `✓ Conectado: ${response.data} snippets`;
  } else {
    result.classList.add('error');
    result.textContent = `✗ ${response.error}`;
  }
}

async function saveSettings() {
  const next = { storage: selectedStorage(), apiUrl: settingsElements.apiUrlInput.value.trim() };
  const changed = next.storage !== currentSettings.storage || next.apiUrl !== currentSettings.apiUrl;

  const result = await window.api.saveSettings(next);
  if (!result.success) {
    showToast(result.error, 'error');
    return;
  }
  closeSettings();
  if (!changed) {
    return;
  }

  // Otro almacenamiento: otra lista de snippets
  await loadSettings();
  selectedSnippet = null;
  editingSnippet = null;
  elements.snippetView.style.display = 'none';
  elements.editView.style.display = 'none';
  elements.emptyState.style.display = 'flex';
  await loadSnippets();
}

function setupSettingsListeners() {
  settingsElements.button.addEventListener('click', openSettings);
  settingsElements.cancelBtn.addEventListener('click', closeSettings);
  settingsElements.saveBtn.addEventListener('click', saveSettings);
  settingsElements.testApiBtn.addEventListener('click', testApiConnection);
  settingsElements.showDataFileBtn.addEventListener('click', () => window.api.showDataFile());
  settingsElements.radios.forEach(radio => radio.addEventListener('change', updateStorageDetails));
  settingsElements.apiUrlInput.addEventListener('input', () => {
    settingsElements.apiTestResult.textContent = '';
  });
  // Clic fuera del diálogo o Escape: cerrar sin guardar
  settingsElements.modal.addEventListener('click', event => {
    if (event.target === settingsElements.modal) {
      closeSettings();
    }
  });
  settingsElements.modal.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeSettings();
    }
  });
}

// ============================================
// SYNTAX HIGHLIGHTING
// ============================================
function highlightCode(code, language) {
  const codeBlock = elements.snippetCode;
  codeBlock.textContent = code;

  // Remover clases previas
  codeBlock.className = 'code-block';

  // Mapeo de lenguajes a highlight.js
  const languageMap = {
    javascript: 'javascript',
    typescript: 'typescript',
    react: 'jsx',
    vue: 'xml',
    angular: 'typescript',
    nodejs: 'javascript',
    python: 'python',
    java: 'java',
    csharp: 'csharp',
    cpp: 'cpp',
    php: 'php',
    ruby: 'ruby',
    go: 'go',
    rust: 'rust',
    swift: 'swift',
    kotlin: 'kotlin',
    html: 'xml',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    sql: 'sql',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    markdown: 'markdown',
    bash: 'bash',
    powershell: 'powershell',
    git: 'bash',
    docker: 'dockerfile',
    http: 'http',
    graphql: 'graphql',
    regex: 'plaintext', // highlight.js no tiene gramática de expresiones regulares
  };

  const mapped = languageMap[String(language).toLowerCase()];
  // Lenguajes sin gramática cargada (p. ej. "other"): texto plano en vez de un error en consola
  const hljsLanguage = typeof hljs !== 'undefined' && mapped && hljs.getLanguage(mapped) ? mapped : 'plaintext';

  try {
    if (typeof hljs !== 'undefined') {
      codeBlock.classList.add('hljs');
      const highlighted = hljs.highlight(code, { language: hljsLanguage, ignoreIllegals: true });
      codeBlock.innerHTML = highlighted.value;
    }
  } catch (error) {
    console.warn('Error al aplicar syntax highlighting:', error);
    codeBlock.textContent = code;
  }
}

// ============================================
// CRUD OPERATIONS
// ============================================
async function loadSnippets() {
  showLoading();
  const result = await window.api.getSnippets();

  if (result.success) {
    snippets = result.data;
    populateLanguageFilter();
    applyFilters();
    showToast('Snippets cargados correctamente', 'success');
  } else {
    showToast('Error al cargar snippets: ' + result.error, 'error');
  }
}

function showLoading() {
  elements.snippetsList.innerHTML = '<div class="loading">Cargando snippets...</div>';
}

function renderSnippetsList() {
  if (filteredSnippets.length === 0) {
    elements.snippetsList.innerHTML = '<div class="loading">No se encontraron snippets</div>';
    return;
  }

  elements.snippetsList.innerHTML = filteredSnippets
    .map(
      snippet => `
    <div class="snippet-item ${selectedSnippet?._id === snippet._id ? 'active' : ''}" data-id="${escapeHtml(snippet._id)}">
      <div class="snippet-item-header">
        <span class="snippet-item-title">${escapeHtml(snippet.description)}</span>
        <span class="language-badge">${escapeHtml(snippet.language)}</span>
      </div>
      <div class="snippet-item-preview">${escapeHtml(snippet.code.substring(0, 60))}...</div>
      <div class="snippet-item-footer">
        <span>${formatDate(snippet.fecha)}</span>
        <span class="snippet-rating">${'★'.repeat(snippet.rating || 0)}${'☆'.repeat(5 - (snippet.rating || 0))}</span>
      </div>
    </div>
  `
    )
    .join('');

  document.querySelectorAll('.snippet-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      selectSnippet(id);
    });
  });
}

function selectSnippet(id) {
  selectedSnippet = snippets.find(s => s._id === id);
  if (!selectedSnippet) return;

  showSnippetView();
  renderSelectedSnippet();
  renderSnippetsList();
}

function showSnippetView() {
  elements.emptyState.style.display = 'none';
  elements.editView.style.display = 'none';
  elements.snippetView.style.display = 'block';
}

function renderSelectedSnippet() {
  if (!selectedSnippet) return;

  elements.snippetDescription.textContent = selectedSnippet.description;
  elements.snippetLanguage.textContent = selectedSnippet.language;
  elements.codeLanguageLabel.textContent = `Código (${selectedSnippet.language})`;
  elements.snippetDate.textContent = 'Creado: ' + formatDate(selectedSnippet.fecha);

  // Aplicar syntax highlighting
  highlightCode(selectedSnippet.code, selectedSnippet.language);

  renderStarsDisplay(selectedSnippet.rating || 0);
}

function renderStarsDisplay(rating) {
  elements.starsDisplay.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star' + (i <= rating ? ' filled' : '');
    star.textContent = i <= rating ? '★' : '☆';
    star.dataset.value = i;
    star.style.cursor = 'pointer';
    star.addEventListener('click', () => updateRating(i));
    elements.starsDisplay.appendChild(star);
  }
}

async function updateRating(rating) {
  if (!selectedSnippet) return;

  const result = await window.api.updateRating(selectedSnippet._id, rating);

  if (result.success) {
    selectedSnippet.rating = rating;
    const snippetInList = snippets.find(s => s._id === selectedSnippet._id);
    if (snippetInList) {
      snippetInList.rating = rating;
    }
    renderStarsDisplay(rating);
    renderSnippetsList();
    showToast('Rating actualizado', 'success');
  } else {
    showToast('Error al actualizar rating', 'error');
  }
}

function showNewSnippetView() {
  editingSnippet = null;
  elements.editTitle.textContent = 'Nuevo Snippet';
  elements.formDescription.value = '';
  elements.formLanguage.value = '';
  elements.formCode.value = '';
  elements.formRating.value = '0';
  currentRating = 0;
  updateStarsInput();

  elements.emptyState.style.display = 'none';
  elements.snippetView.style.display = 'none';
  elements.editView.style.display = 'block';
  elements.formDescription.focus();
}

function showEditSnippetView() {
  if (!selectedSnippet) return;

  editingSnippet = selectedSnippet;
  elements.editTitle.textContent = 'Editar Snippet';
  elements.formDescription.value = selectedSnippet.description;
  elements.formLanguage.value = selectedSnippet.language;
  elements.formCode.value = selectedSnippet.code;
  elements.formRating.value = selectedSnippet.rating || '0';
  currentRating = selectedSnippet.rating || 0;
  updateStarsInput();

  elements.emptyState.style.display = 'none';
  elements.snippetView.style.display = 'none';
  elements.editView.style.display = 'block';
  elements.formDescription.focus();
}

function updateStarsInput() {
  const stars = elements.starsInput.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < currentRating) {
      star.classList.add('active');
      star.textContent = '★';
    } else {
      star.classList.remove('active');
      star.textContent = '☆';
    }
  });
}

async function saveSnippet(event) {
  event.preventDefault();

  const snippetData = {
    description: elements.formDescription.value.trim(),
    language: elements.formLanguage.value,
    code: elements.formCode.value.trim(),
    rating: parseInt(elements.formRating.value) || 0,
  };

  if (!snippetData.description || !snippetData.language || !snippetData.code) {
    showToast('Por favor completa todos los campos', 'warning');
    return;
  }

  const result = editingSnippet ? await updateExistingSnippet(snippetData) : await createNewSnippet(snippetData);

  if (result.success) {
    populateLanguageFilter();
    applyFilters();
    if (selectedSnippet) {
      showSnippetView();
      renderSelectedSnippet();
    } else {
      elements.emptyState.style.display = 'flex';
      elements.editView.style.display = 'none';
    }
  } else {
    showToast('Error al guardar snippet: ' + result.error, 'error');
  }
}

async function updateExistingSnippet(snippetData) {
  const result = await window.api.updateSnippet(editingSnippet._id, snippetData);
  if (result.success) {
    const index = snippets.findIndex(s => s._id === editingSnippet._id);
    if (index !== -1) {
      // Se usa lo que devuelve el servidor para no mostrar datos que no se han guardado
      snippets[index] = { ...snippets[index], ...snippetData, ...result.data };
      selectedSnippet = snippets[index];
    }
    showToast('Snippet actualizado correctamente', 'success');
  }
  return result;
}

async function createNewSnippet(snippetData) {
  const result = await window.api.createSnippet(snippetData);
  if (result.success) {
    await loadSnippets();
    showToast('Snippet creado correctamente', 'success');
  }
  return result;
}

function cancelEdit() {
  if (selectedSnippet) {
    showSnippetView();
    renderSelectedSnippet();
  } else {
    elements.editView.style.display = 'none';
    elements.emptyState.style.display = 'flex';
  }
}

async function deleteSnippet() {
  if (!selectedSnippet) return;

  const confirmed = confirm(`¿Estás seguro de eliminar "${selectedSnippet.description}"?`);
  if (!confirmed) return;

  const result = await window.api.deleteSnippet(selectedSnippet._id);

  if (result.success) {
    snippets = snippets.filter(s => s._id !== selectedSnippet._id);
    selectedSnippet = null;
    populateLanguageFilter();
    applyFilters();
    elements.snippetView.style.display = 'none';
    elements.emptyState.style.display = 'flex';
    showToast('Snippet eliminado correctamente', 'success');
  } else {
    showToast('Error al eliminar snippet: ' + result.error, 'error');
  }
}

function copyCode() {
  if (!selectedSnippet) return;

  navigator.clipboard
    .writeText(selectedSnippet.code)
    .then(() => {
      showToast('Código copiado al portapapeles', 'success');
    })
    .catch(() => {
      showToast('Error al copiar código', 'error');
    });
}

// ============================================
// IMPORT / EXPORT FUNCIONES
// ============================================
async function exportSnippets() {
  if (snippets.length === 0) {
    showToast('No hay snippets para exportar', 'warning');
    return;
  }

  const result = await window.api.exportSnippets(snippets);

  if (result.success) {
    showToast(`${snippets.length} snippets exportados correctamente`, 'success');
  } else if (!result.cancelled) {
    showToast('Error al exportar snippets: ' + result.error, 'error');
  }
}

async function importSnippets() {
  const result = await window.api.importSnippets();

  if (result.success) {
    const importedSnippets = result.data;
    const skippedNote = result.skipped
      ? `\n\nSe descartarán ${result.skipped} elementos sin descripción, lenguaje o código.`
      : '';

    if (!Array.isArray(importedSnippets) || importedSnippets.length === 0) {
      showToast('El archivo no contiene snippets válidos', 'warning');
      return;
    }

    const confirmed = confirm(
      `¿Deseas importar ${importedSnippets.length} snippets?\n\n` +
        `Esto NO eliminará tus snippets actuales, solo agregará los nuevos.` +
        skippedNote
    );

    if (!confirmed) return;

    // Todos de una vez (en modo API, una sola petición a POST /importar)
    const batchResult = await window.api.importBatch(importedSnippets);
    await loadSnippets();

    if (batchResult.success) {
      showToast(`${batchResult.data} snippets importados correctamente`, 'success');
    } else {
      showToast('Error al importar snippets: ' + batchResult.error, 'error');
    }
  } else if (!result.cancelled) {
    showToast('Error al importar snippets: ' + result.error, 'error');
  }
}

async function exportSingleSnippet() {
  if (!selectedSnippet) return;

  const result = await window.api.exportSingleSnippet(selectedSnippet);

  if (result.success) {
    showToast('Snippet exportado correctamente', 'success');
  } else if (!result.cancelled) {
    showToast('Error al exportar snippet: ' + result.error, 'error');
  }
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================
function applyFilters() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const languageFilter = elements.languageFilter.value;

  filteredSnippets = snippets.filter(snippet => {
    const matchesSearch =
      snippet.description.toLowerCase().includes(searchTerm) || snippet.code.toLowerCase().includes(searchTerm);
    const matchesLanguage = !languageFilter || snippet.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  renderSnippetsList();
  updateSnippetCount();
}

function updateSnippetCount() {
  elements.snippetCount.textContent = filteredSnippets.length;
}

function populateLanguageFilter() {
  const languages = [...new Set(snippets.map(s => s.language))].sort();
  const currentValue = elements.languageFilter.value;

  elements.languageFilter.innerHTML =
    '<option value="">Todos los lenguajes</option>' +
    languages.map(lang => `<option value="${escapeHtml(lang)}">${escapeHtml(lang)}</option>`).join('');

  elements.languageFilter.value = currentValue;
}

// ============================================
// UTILIDADES
// ============================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// También escapa comillas: se usa dentro de atributos (value, data-id)
function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, char => HTML_ESCAPES[char]);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  // Botones principales
  elements.newSnippetBtn.addEventListener('click', showNewSnippetView);
  elements.refreshBtn.addEventListener('click', loadSnippets);
  elements.importBtn.addEventListener('click', importSnippets);
  elements.exportBtn.addEventListener('click', exportSnippets);
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  elements.emptyImportBtn.addEventListener('click', importSnippets);

  // Búsqueda y filtros
  elements.searchInput.addEventListener('input', applyFilters);
  elements.languageFilter.addEventListener('change', applyFilters);

  // Acciones de snippet
  elements.editBtn.addEventListener('click', showEditSnippetView);
  elements.deleteBtn.addEventListener('click', deleteSnippet);
  elements.copyBtn.addEventListener('click', copyCode);
  elements.exportSingleBtn.addEventListener('click', exportSingleSnippet);

  // Formulario
  elements.snippetForm.addEventListener('submit', saveSnippet);
  elements.saveBtn.addEventListener('click', saveSnippet);
  elements.cancelBtn.addEventListener('click', cancelEdit);

  // Rating input
  elements.starsInput.querySelectorAll('.star').forEach((star, index) => {
    star.addEventListener('click', () => {
      currentRating = index + 1;
      elements.formRating.value = currentRating;
      updateStarsInput();
    });

    star.addEventListener('mouseenter', () => {
      elements.starsInput.querySelectorAll('.star').forEach((s, i) => {
        if (i <= index) {
          s.textContent = '★';
        } else {
          s.textContent = '☆';
        }
      });
    });
  });

  elements.starsInput.addEventListener('mouseleave', updateStarsInput);
}

// ============================================
// ATAJOS DE TECLADO
// ============================================
const isMac = navigator.userAgent.includes('Mac');
const MOD_LABEL = isMac ? '⌘' : 'Ctrl+';

const isShown = element => element.style.display === 'block';

function isSettingsOpen() {
  return !settingsElements.modal.hidden;
}

function focusSearch() {
  elements.searchInput.focus();
  elements.searchInput.select();
}

// Ctrl/⌘+N nuevo · Ctrl/⌘+F buscar · Ctrl/⌘+S guardar · Ctrl/⌘+E editar · Esc cancelar / limpiar búsqueda
const SHORTCUTS = {
  n: () => showNewSnippetView(),
  f: () => focusSearch(),
  s: event => isShown(elements.editView) && saveSnippet(event),
  e: () => isShown(elements.snippetView) && showEditSnippetView(),
};

function handleEscape(event) {
  if (document.activeElement === elements.searchInput && elements.searchInput.value) {
    elements.searchInput.value = '';
    applyFilters();
  } else if (isShown(elements.editView)) {
    event.preventDefault();
    cancelEdit();
  }
}

function handleShortcut(event) {
  // El modal de Ajustes gestiona su propio Escape
  if (isSettingsOpen()) {
    return;
  }
  if (event.key === 'Escape') {
    handleEscape(event);
    return;
  }
  const modifier = isMac ? event.metaKey : event.ctrlKey;
  const action = SHORTCUTS[event.key.toLowerCase()];
  if (!modifier || event.altKey || event.shiftKey || !action) {
    return;
  }
  event.preventDefault();
  action(event);
}

function setupShortcuts() {
  elements.newSnippetBtn.title = `Nuevo snippet (${MOD_LABEL}N)`;
  elements.searchInput.title = `Buscar (${MOD_LABEL}F)`;
  elements.saveBtn.title = `Guardar (${MOD_LABEL}S)`;
  elements.editBtn.title = `Editar (${MOD_LABEL}E)`;
  elements.cancelBtn.title = 'Cancelar (Esc)';
  document.addEventListener('keydown', handleShortcut);
}

// ============================================
// INICIAR APLICACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', init);
