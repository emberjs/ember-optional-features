'use strict';

const SilentError = require('silent-error');

const DEFAULT_VALUES = {
  'application-template-wrapper': true,
  'template-only-component-wrapper': true
};

const SUPPORTED_FEATURES = Object.keys(DEFAULT_VALUES);

module.exports = {
  name: '@ember/optional-features',

  includedCommands() {
    return require('./commands');
  },

  init() {
    this._super && this._super.init.apply(this, arguments);
    this._features = this._loadFeatures();
    this._validateFeatures();
  },

  _loadFeatures() {
    try {
      return this.project.require('config/optional-features.json');
    } catch(err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        throw err;
      }
    }

    try {
      return this.project.require('config/optional-features')();
    } catch(err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        throw err;
      }
    }

    return {};
  },

  _validateFeatures() {
    let features = this._features;
    let keys = Object.keys(features);

    keys.forEach(key => {
      if (SUPPORTED_FEATURES.indexOf(key) === -1) {
        throw new SilentError(`Unknown feature "${key}" found in config/optional-features.js`);
      } else if (typeof features[key] !== 'boolean') {
        throw new SilentError(`Unsupported value "${String(features[key])}" for "${key}" found in config/optional-features.js`);
      }
    });

    SUPPORTED_FEATURES.forEach(key => {
      if (features[key] === undefined) {
        features[key] = DEFAULT_VALUES[key];
      }
    });

    this._features = features;
  },

  isEnabled(name) {
    return this._features[name];
  },

  config() {
    let EmberENV = {};

    let features = this._features;
    let keys = Object.keys(features);

    keys.forEach(key => {
      let value = features[key];

      if (value !== DEFAULT_VALUES[key]) {
        let KEY = `_${key.toUpperCase().replace(/-/g, '_')}`;
        EmberENV[KEY] = value;
      }
    });

    return { EmberENV };
  }
};
