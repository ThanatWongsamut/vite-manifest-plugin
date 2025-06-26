import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        console: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Add any custom rules here
    }
  },
  {
    files: ['**/*.test.{js,ts}'],
    rules: {
      // Test-specific rules can go here
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/']
  }
]; 