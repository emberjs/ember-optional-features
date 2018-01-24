'use strict';

/* eslint-disable no-console */
const SilentError = require('silent-error');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const FEATURES = require('../features');

const SHARED = {
  _ensureConfigFile() {
    try {
      return this.project.resolveSync('./config/optional-features.json');
    } catch(err) {
      if (err.code !== 'MODULE_NOT_FOUND') {
        throw err;
      }
    }

    mkdirp.sync(path.join(this.project.root, 'config'));

    let configPath = path.join(this.project.root, 'config', 'optional-features.json');

    fs.writeFileSync(configPath, '{}', { encoding: 'UTF-8' });

    return configPath;
  },

  _setFeature(name, value) {
    let configPath = this._ensureConfigFile();
    let configJSON = JSON.parse(fs.readFileSync(configPath, { encoding: 'UTF-8' }));
    let config = {};

    FEATURES.NAMES.forEach(feature => {
      if (feature === name) {
        config[feature] = value;
      } else if(configJSON[feature] !== undefined) {
        config[feature] = configJSON[feature];
      }
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', { encoding: 'UTF-8' });
  }
};

const ENABLE_FEATURE = Object.assign({
  name: 'feature:enable',
  description: 'Enable feature.',
  works: 'insideProject',
  anonymousOptions: [
    '<feature-name>'
  ],
  run(_, args) {
    this._setFeature(args[0], true);
  }
}, SHARED);

const DISABLE_FEATURE = Object.assign({
  name: 'feature:disable',
  description: 'Disable feature.',
  works: 'insideProject',
  anonymousOptions: [
    '<feature-name>'
  ],
  run(_, args) {
    this._setFeature(args[0], false);
  }
}, SHARED);

module.exports = {
  "feature:enable": ENABLE_FEATURE,
  "feature:disable": DISABLE_FEATURE
}
