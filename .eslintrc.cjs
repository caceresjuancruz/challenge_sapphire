module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.eslint.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  rules: {
    // TypeScript strict rules
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    // Allow async methods without await (useful for interface compliance and future DB implementations)
    '@typescript-eslint/require-await': 'off',
    // Allow namespace for Express type augmentation
    '@typescript-eslint/no-namespace': 'off',

    // Clean Code rules
    'no-console': ['warn', { allow: ['error', 'warn', 'info'] }],
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    complexity: ['warn', 10],
    'max-depth': ['warn', 3],
    'max-params': ['warn', 4],

    // Prettier integration
    'prettier/prettier': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.js', '!.eslintrc.cjs'],
  overrides: [
    {
      files: ['tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'max-lines-per-function': 'off',
      },
    },
  ],
};
