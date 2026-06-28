import pluginVue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignora artefatos de build e componentes gerados pelo shadcn
  {
    ignores: ['dist/**', 'src/components/ui/**'],
  },
  // Configuração base TypeScript para arquivos .ts
  ...tseslint.configs.recommended,
  // Configuração para arquivos Vue com suporte a TypeScript
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    rules: {
      // Sem `any` explícito — consistente com tsconfig strict
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
