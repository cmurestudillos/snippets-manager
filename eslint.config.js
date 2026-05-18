const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

const sharedRules = {
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
  'no-undef': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-debugger': 'warn',
  eqeqeq: ['error', 'always'],
  curly: 'error',
  complexity: ['warn', 10],
  'max-depth': ['warn', 4],
  'prettier/prettier': 'error',
};

module.exports = [
  {
    ignores: ['dist/**', 'build/**', 'release/**', 'coverage/**', 'node_modules/**', '**/*.min.js'],
  },
  {
    files: ['src/main.js', 'src/preload.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: sharedRules,
  },
  {
    files: ['src/renderer.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        hljs: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: sharedRules,
  },
  eslintConfigPrettier,
];
