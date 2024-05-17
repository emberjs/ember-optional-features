/* This module exists so you can use this package as a library rather than a
fully-instantiated v1 ember-addon inside ember-cli. */

const SilentError = require('silent-error');
const FEATURES = require('./features');
const fs = require('fs');
const path = require('path');

class OptionalFeatures {
  static forProject(project) {
    const { getConfigDir } = require('./utils');
    return new this(getConfigDir(project));
  }

  constructor(configDir) {
    this._features = this._validateFeatures(this._loadFeatures(configDir));
  }

  _loadFeatures(configDir) {
    let features = {};
    let configPath = path.resolve(configDir, 'optional-features.json');
    if (fs.existsSync(configPath)) {
      Object.assign(features, JSON.parse(fs.readFileSync(configPath)));
    }
    if (process.env.EMBER_OPTIONAL_FEATURES) {
      Object.assign(features, JSON.parse(process.env.EMBER_OPTIONAL_FEATURES));
    }
    return features;
  }

  _validateFeatures(features) {
    let validated = {};
    let keys = Object.keys(features);
    keys.forEach((key) => {
      if (FEATURES[key] === undefined) {
        throw new SilentError(
          `Unknown feature "${key}" found in config/optional-features.json`
        );
      } else if (features[key] !== null && typeof features[key] !== 'boolean') {
        throw new SilentError(
          `Unsupported value "${String(
            features[key]
          )}" for "${key}" found in config/optional-features.json`
        );
      }
    });

    Object.keys(FEATURES).forEach((key) => {
      if (typeof features[key] === 'boolean') {
        validated[key] = features[key];
      }
    });

    return validated;
  }

  isFeatureEnabled(name) {
    let value = this._features[name];
    if (value !== undefined) {
      return value;
    }
    let feature = FEATURES[name];
    if (feature) {
      return feature.default;
    }
    return false;
  }

  isFeatureExplicitlySet(name) {
    return this._features[name] !== undefined;
  }

  config() {
    let EmberENV = {};
    let features = this._features;

    Object.keys(FEATURES).forEach((key) => {
      let value = features[key];

      if (value !== undefined) {
        let KEY = `_${key.toUpperCase().replace(/-/g, '_')}`;
        EmberENV[KEY] = value;
      }
    });

    return { EmberENV };
  }
}

module.exports = { OptionalFeatures };
