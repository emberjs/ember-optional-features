'use strict';

const SilentError = require('silent-error');

const FEATURES = require('./features');

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
    if (process.env.EMBER_OPTIONAL_FEATURES) {
      return JSON.parse(process.env.EMBER_OPTIONAL_FEATURES);
    }

    try {
      return this.project.require('config/optional-features.json');
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
      if (FEATURES.NAMES.indexOf(key) === -1) {
        throw new SilentError(`Unknown feature "${key}" found in config/optional-features.json`);
      } else if (typeof features[key] !== 'boolean') {
        throw new SilentError(`Unsupported value "${String(features[key])}" for "${key}" found in config/optional-features.json`);
      }
    });

    FEATURES.NAMES.forEach(key => {
      if (features[key] === undefined) {
        features[key] = FEATURES.DEFAULTS[key];
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

      if (value !== FEATURES.DEFAULTS[key]) {
        let KEY = `_${key.toUpperCase().replace(/-/g, '_')}`;
        EmberENV[KEY] = value;
      }
    });

    return { EmberENV };
  }
};
