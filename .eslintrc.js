module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
