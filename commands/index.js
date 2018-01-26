'use strict';

/* eslint-disable no-console */
const SilentError = require('silent-error');
const chalk = require('chalk');
const co = require('co');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const strip = require('../fmt').strip;

const FEATURES = require('../features');

const USAGE_MESSAGE = strip`
  Usage:

    To list all available features, run ${chalk.bold('ember feature:list')}.
    To enable a feature, run ${chalk.bold('ember feature:enable some-feature')}.
    To disable a feature, run ${chalk.bold('ember feature:disable some-feature')}.
`;

const USAGE = {
  name: 'feature',
  description: 'Prints the USAGE.',
  works: 'insideProject',
  run() {
    console.log(USAGE_MESSAGE);
  }
};

const LIST_FEATURES = {
  name: 'feature:list',
  description: 'List all available features.',
  works: 'insideProject',
  run() {
    console.log(USAGE_MESSAGE);
    console.log('Available features:');

    Object.keys(FEATURES).forEach(key => {
      let feature = FEATURES[key];

      console.log(strip`
        ${''}
          ${chalk.bold(key)} ${chalk.cyan(`(Default: ${feature.default})`)}
             ${feature.description}
             ${chalk.gray(`More information: ${chalk.underline(feature.url)}`)}
      `);
    });
  }
};

const SHARED = {
  // TODO: promisify the sync code below

  _ensureConfigFile: co.wrap(function *() {
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
  }),

  _setFeature: co.wrap(function *(name, value) {
    let feature = FEATURES[name];

    if (feature === undefined) {
      console.log(chalk.red(`Error: ${chalk.bold(name)} is not a valid feature.\n`));
      return LIST_FEATURES.run();
    }

    let configPath = yield this._ensureConfigFile();
    let configJSON = JSON.parse(fs.readFileSync(configPath, { encoding: 'UTF-8' }));

    if (typeof feature.callback === 'function') {
      yield feature.callback(this.project, value);
    }

    let config = {};

    Object.keys(FEATURES).forEach(feature => {
      if (feature === name) {
        config[feature] = value;
      } else if(configJSON[feature] !== undefined) {
        config[feature] = configJSON[feature];
      }
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', { encoding: 'UTF-8' });

    let state = value ? 'Enabled' : 'Disabled';

    console.log(chalk.green(`${state} ${chalk.bold(name)}. Be sure to commit ${chalk.underline('config/optional-features.json')} to source control!`));
  })
};

const ENABLE_FEATURE = Object.assign({
  name: 'feature:enable',
  description: 'Enable feature.',
  works: 'insideProject',
  anonymousOptions: [
    '<feature-name>'
  ],
  run(_, args) {
    return this._setFeature(args[0], true);
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
    return this._setFeature(args[0], false);
  }
}, SHARED);

module.exports = {
  'feature': USAGE,
  'feature:list': LIST_FEATURES,
  'feature:enable': ENABLE_FEATURE,
  'feature:disable': DISABLE_FEATURE
}
