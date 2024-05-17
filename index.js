'use strict';

const { OptionalFeatures } = require('./api');

module.exports = {
  name: '@ember/optional-features',

  includedCommands() {
    return require('./commands');
  },

  init() {
    this._super && this._super.init.apply(this, arguments);
    this._features = OptionalFeatures.forProject(this.project);
  },

  isFeatureEnabled(name) {
    return this._features.isFeatureEnabled(name);
  },

  isFeatureExplicitlySet(name) {
    return this._features.isFeatureExplicitlySet(name);
  },

  config() {
    return this._features.config();
  },
};
