import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  {
    rules: {
      semi: 'error',
      'prefer-const': 'error',
    },
  },
  globalIgnores(['build/**/*', 'dist/**/*']),
]);
