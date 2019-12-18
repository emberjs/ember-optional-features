module.exports = {
  root: true,
  plugins: ['node'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  parserOptions: {
    sourceType: 'script',
    ecmaVersion: 2017
  },
  env: {
    browser: false,
    node: true
  },
  overrides: [
    // test files
    {
      files: ['tests/**/*.js'],
      env: {
        qunit: true
      }
    }
  ]
};
