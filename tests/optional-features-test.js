'use strict';

const Addon = require('..');
const Project = require('ember-cli/lib/models/project');
const createTempDir = require('broccoli-test-helper').createTempDir;

function stringify(obj) {
  return JSON.stringify(obj, null, 2);
}

QUnit.module('@ember/optional-features', (hooks) => {
  let override, projectRoot;

  function buildAddon(features) {
    if (features) {
      projectRoot.write({
        config: {
          'optional-features.json': stringify(features),
        },
      });
    }

    let addon = Object.create(Addon);
    addon.project = Project.closestSync(projectRoot.path());
    addon.init();
    return addon;
  }

  hooks.beforeEach(() => {
    override = process.env.EMBER_OPTIONAL_FEATURES;
    return createTempDir().then((tmpDir) => {
      projectRoot = tmpDir;

      projectRoot.write({
        'package.json': stringify({
          name: 'test-project',
          devDependencies: {
            'ember-cli': '*',
          },
        }),
      });
    });
  });

  hooks.afterEach(() => {
    if (override === undefined) {
      delete process.env.EMBER_OPTIONAL_FEATURES;
    } else {
      process.env.EMBER_OPTIONAL_FEATURES = override;
    }

    return projectRoot.dispose();
  });

  QUnit.test('it throws on invalid key', (assert) => {
    assert.throws(() => buildAddon({ foo: true }), /Unknown feature "foo"/);
  });

  QUnit.test('it throws on invalid value', (assert) => {
    assert.throws(
      () => buildAddon({ 'application-template-wrapper': 'nope' }),
      /Unsupported value "nope" for "application-template-wrapper"/
    );
  });

  QUnit.test(
    'it generates an empty config when features are not passed',
    (assert) => {
      let addon = buildAddon({});
      assert.deepEqual(
        addon.config(),
        { EmberENV: {} },
        'Expecting empty config'
      );
    }
  );

  QUnit.test(
    'it generates the correct config when features are passed',
    (assert) => {
      let addon = buildAddon({
        'application-template-wrapper': false,
        'template-only-glimmer-components': true,
        'jquery-integration': true,
        'no-implicit-route-model': false,
      });

      let expected = {
        EmberENV: {
          _APPLICATION_TEMPLATE_WRAPPER: false,
          _TEMPLATE_ONLY_GLIMMER_COMPONENTS: true,
          _JQUERY_INTEGRATION: true,
          _NO_IMPLICIT_ROUTE_MODEL: false,
        },
      };

      assert.deepEqual(addon.config(), expected, 'Expecting correct config');
    }
  );

  QUnit.test(
    'it does not remove features that matches their default value',
    (assert) => {
      let addon = buildAddon({
        'application-template-wrapper': true,
        'template-only-glimmer-components': true,
        'jquery-integration': true,
      });

      let expected = {
        EmberENV: {
          _APPLICATION_TEMPLATE_WRAPPER: true,
          _TEMPLATE_ONLY_GLIMMER_COMPONENTS: true,
          _JQUERY_INTEGRATION: true,
        },
      };

      assert.deepEqual(addon.config(), expected, 'Expecting correct config');
    }
  );

  QUnit.test('it allows `null` to mean using the default value', (assert) => {
    let addon = buildAddon({
      'application-template-wrapper': null,
      'template-only-glimmer-components': null,
      'jquery-integration': null,
    });

    let expected = {
      EmberENV: {},
    };

    assert.deepEqual(addon.config(), expected, 'Expecting correct config');
  });

  QUnit.test('it can query the features with `isFeatureEnabled`', (assert) => {
    let addon = buildAddon({
      'application-template-wrapper': false,
    });

    assert.strictEqual(
      addon.isFeatureEnabled('application-template-wrapper'),
      false,
      'Expecting suppied value'
    );
    assert.strictEqual(
      addon.isFeatureEnabled('template-only-glimmer-components'),
      false,
      'Expecting default value'
    );
  });

  QUnit.test(
    'it can query the features with `isFeatureExplicitlySet`',
    (assert) => {
      let addon = buildAddon({
        'application-template-wrapper': false,
      });

      assert.strictEqual(
        addon.isFeatureExplicitlySet('application-template-wrapper'),
        true,
        'Expecting value to exist'
      );
      assert.strictEqual(
        addon.isFeatureExplicitlySet('template-only-glimmer-components'),
        false,
        'Expecting to not exist'
      );
    }
  );

  QUnit.test(
    'it allows the config to be a overridden with an ENV variable',
    (assert) => {
      process.env.EMBER_OPTIONAL_FEATURES = `{ "application-template-wrapper": false }`;

      let addon = buildAddon({
        'application-template-wrapper': true,
        'template-only-glimmer-components': true,
        'jquery-integration': true,
      });

      assert.strictEqual(
        addon.isFeatureEnabled('application-template-wrapper'),
        false,
        'Expecting value from ENV var'
      );
      assert.strictEqual(
        addon.isFeatureEnabled('template-only-glimmer-components'),
        true,
        'Expecting value from JSON'
      );
      assert.strictEqual(
        addon.isFeatureEnabled('jquery-integration'),
        true,
        'Expecting value from JSON'
      );
    }
  );

  QUnit.test('can provide custom config path', (assert) => {
    projectRoot.write({
      'package.json': stringify({
        name: 'test-project',
        devDependencies: {
          'ember-cli': '*',
        },
        'ember-addon': {
          configPath: 'tests/dummy/config',
        },
      }),
      tests: {
        dummy: {
          config: {
            'optional-features.json': stringify({
              'application-template-wrapper': false,
              'template-only-glimmer-components': true,
              'jquery-integration': true,
            }),
          },
        },
      },
    });

    let addon = buildAddon();

    let expected = {
      EmberENV: {
        _APPLICATION_TEMPLATE_WRAPPER: false,
        _TEMPLATE_ONLY_GLIMMER_COMPONENTS: true,
        _JQUERY_INTEGRATION: true,
      },
    };

    assert.deepEqual(addon.config(), expected, 'Expecting correct config');
  });
});
