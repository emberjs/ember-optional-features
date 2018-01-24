'use strict';

const Addon = require('..');

class Project {
  constructor(features) {
    this.features = features;
  }

  require(path) {
    let features = this.features;

    if (path === 'config/optional-features.json' && typeof features === 'object') {
      return this.features;
    } else {
      let error = new Error(`Invalid path: ${path}`);
      error.code = 'MODULE_NOT_FOUND';
      throw error;
    }
  }
}

function buildAddon(features) {
  let addon = Object.create(Addon);
  addon.project = new Project(features);
  addon.init();
  return addon;
}

QUnit.module('@ember/optional-features', hooks => {
  let override;

  hooks.beforeEach(() => {
    override = process.env.EMBER_OPTIONAL_FEATURES;
  });

  hooks.afterEach(() => {
    if (override === undefined) {
      delete process.env.EMBER_OPTIONAL_FEATURES;
    } else {
      process.env.EMBER_OPTIONAL_FEATURES = override;
    }
  });

  QUnit.test('it throws on invalid key', assert => {
    assert.throws(() => buildAddon({ foo: true }), /Unknown feature "foo"/);
  });

  QUnit.test('it throws on invalid value', assert => {
    assert.throws(
      () => buildAddon({ 'application-template-wrapper': 'nope' }),
      /Unsupported value "nope" for "application-template-wrapper"/
    );
  });

  QUnit.test('it generates an empty config when features are not passed', assert => {
    let addon = buildAddon({});
    assert.deepEqual(addon.config(), { EmberENV: {} }, 'Expecting empty config');
  });

  QUnit.test('it generates the correct config when features are passed', assert => {
    let addon = buildAddon({
      'application-template-wrapper': false,
      'template-only-glimmer-components': true
    });

    let expected = {
      EmberENV: {
        "_APPLICATION_TEMPLATE_WRAPPER": false,
        "_TEMPLATE_ONLY_GLIMMER_COMPONENTS": true
      }
    };

    assert.deepEqual(addon.config(), expected, 'Expecting correct config');
  });

  QUnit.test('it removes features that matches their default value', assert => {
    let addon = buildAddon({
      'application-template-wrapper': true,
      'template-only-glimmer-components': true
    });

    let expected = {
      EmberENV: {
        "_TEMPLATE_ONLY_GLIMMER_COMPONENTS": true
      }
    };

    assert.deepEqual(addon.config(), expected, 'Expecting correct config');
  });

  QUnit.test('it allows `null` to mean using the default value', assert => {
    let addon = buildAddon({
      'application-template-wrapper': null,
      'template-only-glimmer-components': null
    });

    let expected = {
      EmberENV: {}
    };

    assert.deepEqual(addon.config(), expected, 'Expecting correct config');
  });

  QUnit.test('it can query the features with `isEnabled`', assert => {
    let addon = buildAddon({
      'application-template-wrapper': false
    });

    assert.strictEqual(addon.isEnabled('application-template-wrapper'), false, 'Expecting suppied value');
    assert.strictEqual(addon.isEnabled('template-only-glimmer-components'), false, 'Expecting default value');
  });

  QUnit.test('it allows the config to be a overridden with an ENV variable', assert => {
    process.env.EMBER_OPTIONAL_FEATURES = `{ "application-template-wrapper": false }`;

    let addon = buildAddon({
      'application-template-wrapper': true,
      'template-only-glimmer-components': true
    });

    assert.strictEqual(addon.isEnabled('application-template-wrapper'), false, 'Expecting value from ENV var');
    assert.strictEqual(addon.isEnabled('template-only-glimmer-components'), true, 'Expecting value from JSON');
  });
});
