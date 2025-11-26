# 📝 Snippets Manager Pro v2.0

Aplicación de escritorio profesional creada con Electron para gestionar snippets de código con CRUD completo, syntax highlighting, temas personalizables y soporte para frameworks modernos.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Electron](https://img.shields.io/badge/electron-27.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características v2.0

### 🎨 **Nuevas en v2.0**
- ✅ **Syntax Highlighting**: Resaltado de sintaxis con Highlight.js para 30+ lenguajes
- ✅ **Temas Personalizables**: Alterna entre tema oscuro y claro con un clic
- ✅ **Exportar Snippets**: Exporta todos tus snippets a JSON o snippets individuales a archivos
- ✅ **Importar Snippets**: Importa colecciones desde archivos JSON
- ✅ **Soporte para Frameworks**: React, Vue.js, Angular, Node.js y más

### 🔥 **Características Core**
- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar snippets
- ✅ **Búsqueda en tiempo real**: Busca por descripción o código
- ✅ **Filtrado por lenguaje**: Filtra snippets por lenguaje de programación
- ✅ **Sistema de rating**: Califica tus snippets favoritos (1-5 estrellas)
- ✅ **Copiar al portapapeles**: Copia el código con un solo clic
- ✅ **Interfaz moderna**: Diseño profesional estilo VS Code
- ✅ **Sincronización con API**: Conectado a tu endpoint de MongoDB
- ✅ **Persistencia**: Todos los cambios se guardan automáticamente

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn

### Pasos de instalación

1. **Clona o descarga el proyecto**

2. **Navega al directorio del proyecto**:
   ```bash
   cd snippets-manager
   ```

3. **Instala las dependencias**:
   ```bash
   npm install
   ```

## 📖 Uso

### Iniciar la aplicación

Para iniciar la aplicación en modo normal:
```bash
npm start
```

Para iniciar en modo desarrollo (con DevTools):
```bash
npm run dev
```

## 🎯 Guía de Uso

### 🎨 Cambiar Tema

1. Haz clic en el botón 🌓 en el footer de la barra lateral
2. El tema cambia instantáneamente entre oscuro y claro
3. Tu preferencia se guarda automáticamente

### 📝 Crear un nuevo snippet

1. Haz clic en el botón "+ Nuevo Snippet"
2. Completa los campos:
   - **Descripción**: Título o descripción breve
   - **Lenguaje**: Selecciona el lenguaje o framework
   - **Código**: Escribe o pega tu código
   - **Rating**: Califica el snippet (opcional)
3. Haz clic en "💾 Guardar"

### 👁️ Ver un snippet

1. Haz clic en cualquier snippet de la lista lateral
2. Visualiza el código con syntax highlighting
3. Usa el botón "📋 Copiar" para copiar el código
4. Modifica el rating haciendo clic en las estrellas

### ✏️ Editar un snippet

1. Selecciona el snippet que deseas editar
2. Haz clic en "✏️ Editar"
3. Realiza los cambios necesarios
4. Haz clic en "💾 Guardar"

### 🗑️ Eliminar un snippet

1. Selecciona el snippet que deseas eliminar
2. Haz clic en "🗑️ Eliminar"
3. Confirma la eliminación en el diálogo

### 📤 Exportar Snippets

**Exportar todos los snippets:**
1. Haz clic en el botón 📤 en el footer
2. Selecciona la ubicación y nombre del archivo
3. Se guardará un archivo JSON con todos tus snippets

**Exportar un snippet individual:**
1. Selecciona el snippet que quieres exportar
2. Haz clic en "💾 Exportar" en la vista del snippet
3. El snippet se guarda como archivo de código con su extensión correcta
4. Incluye metadata en comentarios del archivo

### 📥 Importar Snippets

1. Haz clic en el botón 📥 en el footer
2. Selecciona un archivo JSON con snippets
3. Confirma la importación
4. Los snippets se agregan a tu colección (no elimina los existentes)

### 🔍 Buscar y filtrar

- **Búsqueda**: Escribe en el campo de búsqueda para filtrar por descripción o código
- **Filtro de lenguaje**: Selecciona un lenguaje específico del menú desplegable

### 🔄 Actualizar la lista

- Haz clic en el botón "🔄" para sincronizar con la API

## 🛠️ Tecnologías utilizadas

- **Electron 27**: Framework para aplicaciones de escritorio
- **Node.js**: Entorno de ejecución
- **Axios**: Cliente HTTP para peticiones a la API
- **Highlight.js**: Biblioteca de syntax highlighting
- **HTML/CSS/JavaScript**: Frontend de la aplicación

## 🎨 Lenguajes y Frameworks Soportados

### JavaScript Ecosystem
- JavaScript
- TypeScript
- React / JSX
- Vue.js
- Angular
- Node.js

### Lenguajes de Programación
- Python
- Java
- C#
- C++
- PHP
- Ruby
- Go
- Rust
- Swift
- Kotlin

### Web Technologies
- HTML
- CSS
- SCSS
- Sass

### Data & Markup
- SQL
- JSON
- XML
- YAML
- Markdown

### Shell & Tools
- Bash
- PowerShell
- Git
- Docker

### Others
- HTTP
- GraphQL
- Regex

## 📡 API Endpoints

La aplicación se conecta a los siguientes endpoints:

- `GET /api/snippets` - Obtener todos los snippets
- `POST /api/snippets` - Crear nuevo snippet
- `PUT /api/snippets/:id` - Actualizar snippet
- `DELETE /api/snippets/:id` - Eliminar snippet
- `PATCH /api/snippets/:id/rating` - Actualizar rating

## 🔧 Configuración

### Cambiar la URL de la API

Si necesitas cambiar el endpoint de la API, edita el archivo `src/main.js`:

```javascript
const API_URL = 'https://tu-nuevo-endpoint.com/api/snippets';
```

### Personalizar Temas de Highlight.js

Para usar otros temas de highlight.js, edita `src/index.html`:

```html
<!-- Tema oscuro -->
<link rel="stylesheet" href="../node_modules/highlight.js/styles/atom-one-dark.css" id="hljs-dark">

<!-- Tema claro -->
<link rel="stylesheet" href="../node_modules/highlight.js/styles/atom-one-light.css" id="hljs-light" disabled>
```

Explora más temas en: https://highlightjs.org/static/demo/

## 📦 Estructura del proyecto

```
snippets-manager/
├── package.json           # Configuración y dependencias
├── README.md             # Este archivo
├── node_modules/         # Dependencias instaladas
└── src/                  # Código fuente
    ├── main.js           # Proceso principal de Electron
    ├── preload.js        # Script de precarga (seguridad)
    ├── renderer.js       # Lógica de la interfaz
    ├── index.html        # Estructura HTML
    └── assets/           # Recursos
        └── styles/
            └── styles.css # Estilos de la aplicación
```

## 🎨 Atajos de teclado

- `Ctrl/Cmd + R` - Recargar la aplicación
- `Ctrl/Cmd + Shift + I` - Abrir DevTools (en modo desarrollo)

## 🐛 Solución de problemas

### La aplicación no se inicia
- Verifica que Node.js esté instalado: `node --version`
- Reinstala las dependencias: `rm -rf node_modules && npm install`

### Error de conexión con la API
- Verifica que la URL de la API sea correcta
- Comprueba tu conexión a internet
- Verifica que el servicio de la API esté funcionando

### Los snippets no se cargan
- Haz clic en el botón "🔄 Actualizar"
- Verifica la consola de errores (F12 en modo desarrollo)

### El syntax highlighting no funciona
- Verifica que highlight.js esté instalado: `npm list highlight.js`
- Reinstala si es necesario: `npm install highlight.js`
- Revisa la consola del navegador para errores

### Los temas no cambian
- Verifica que ambos archivos CSS de highlight.js existan
- Limpia la caché: `Ctrl + Shift + Delete`
- Revisa localStorage: abre DevTools y ejecuta `localStorage.clear()`

## 🚀 Próximas mejoras

- [ ] Modo offline con caché local
- [ ] Etiquetas y categorías personalizadas
- [ ] Búsqueda avanzada con regex
- [ ] Atajos de teclado personalizables
- [ ] Integración con GitHub Gists
- [ ] Sincronización entre dispositivos
- [ ] Snippets colaborativos
- [ ] Plugins y extensiones

## 📄 Licencia

MIT License - Libre para usar y modificar

## 👨‍💻 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:
- Abre un issue en el repositorio
- Consulta la documentación
- Revisa la sección de solución de problemas

---

## 🎉 Changelog

### v2.0.0 (2024)
- ✨ Añadido syntax highlighting con Highlight.js
- ✨ Implementado sistema de temas (oscuro/claro)
- ✨ Añadida funcionalidad de exportar snippets (JSON y archivos individuales)
- ✨ Añadida funcionalidad de importar snippets desde JSON
- ✨ Soporte para frameworks modernos (React, Vue, Angular)
- ✨ Ampliado soporte de lenguajes (30+ lenguajes)
- 🎨 Interfaz mejorada con nuevos iconos y acciones
- 📝 Documentación actualizada y ampliada

### v1.0.0 (2024)
- 🎉 Versión inicial
- ✅ CRUD completo de snippets
- ✅ Búsqueda y filtros
- ✅ Sistema de rating
- ✅ Interfaz moderna

---

**¡Disfruta gestionando tus snippets de código! 🎉**

Made with ❤️ using Electron