'use strict';

const CWD = process.cwd();

const fs = require('fs');
const createTempDir = require('broccoli-test-helper').createTempDir;
const execa = require('execa');
const { mkdirSync } = require('node:fs');
const p = require('path').join;
const strip = require('../utils').strip;
const { stripVTControlCharacters: stripAnsi } = require('node:util');

const FEATURES = require('../features');

function run(...args) {
  let options = {};

  if (typeof args[args.length - 1] === 'object') {
    options = args.pop();
  }

  return execa('ember', args, options);
}

QUnit.module('commands', (hooks) => {
  let project;

  hooks.beforeEach(async function () {
    project = await createTempDir();

    project.write({
      'package.json': strip`
        {
          "name": "dummy",
          "description": "",
          "version": "0.0.0",
          "devDependencies": {
            "@ember/optional-features": "*",
            "ember-cli": "*",
            "ember-source": "*"
          }
        }
      `,
    });

    process.chdir(project.path());

    mkdirSync(p(CWD, 'node_modules', '@ember'), { recursive: true });
    fs.symlinkSync(p(CWD, 'node_modules'), p(project.path(), 'node_modules'));
    fs.symlinkSync(CWD, p(CWD, 'node_modules', '@ember', 'optional-features'));

    mkdirSync(p(CWD, 'node_modules', 'ember-source'), { recursive: true });
    fs.writeFileSync(
      p(CWD, 'node_modules', 'ember-source', 'package.json'),
      strip`
      {
        "name": "ember-source",
        "description": "",
        "version": "9.9.9"
      }
    `,
      { encoding: 'UTF-8' }
    );
  });

  hooks.afterEach(async function () {
    process.chdir(CWD);
    await project.dispose();
    fs.unlinkSync(p(CWD, 'node_modules', '@ember', 'optional-features'));
    fs.unlinkSync(p(CWD, 'node_modules', 'ember-source', 'package.json'));
  });

  function USAGE(command) {
    QUnit.test(`it prints the USAGE message`, async function (assert) {
      let result = await run(command);

      assert.ok(
        result.stdout.indexOf('Usage:') >= 0,
        'it should print the USAGE message'
      );
    });
  }

  QUnit.module('feature', () => {
    USAGE('feature');
  });

  QUnit.module('feature:list', () => {
    USAGE('feature:list');

    QUnit.test(`it lists all the available features`, async function (assert) {
      let result = await run('feature:list');

      assert.ok(
        result.stdout.indexOf('Available features:') >= 0,
        'it list the available features'
      );

      Object.keys(FEATURES).forEach((key) => {
        let feature = FEATURES[key];

        assert.ok(
          stripAnsi(result.stdout).indexOf(
            `${key} (Default: ${feature.default}`
          ) >= 0,
          `it should include ${key} and its default value`
        );
        assert.ok(
          stripAnsi(result.stdout).indexOf(feature.description) >= 0,
          `it should include the description for ${key}`
        );
        assert.ok(
          stripAnsi(result.stdout).indexOf(feature.url) >= 0,
          `it should include the URL for ${key}`
        );
      });
    });
  });

  [
    {
      command: 'feature:enable',
      expected: true,
    },
    {
      command: 'feature:disable',
      expected: false,
    },
  ].forEach((testCase) => {
    QUnit.module(testCase.command, () => {
      QUnit.test('it honors customized config path', async function (assert) {
        project.write({
          'package.json': strip`
            {
              "name": "dummy",
              "description": "",
              "version": "0.0.0",
              "devDependencies": {
                "@ember/optional-features": "*",
                "ember-cli": "*",
                "ember-source": "*"
              },
              "ember-addon": {
                "configPath": "foo/bar"
              }
            }
          `,
        });

        await run(testCase.command, 'application-template-wrapper', {
          input: 'no\n',
        });

        assert.deepEqual(
          project.read('foo/bar'),
          {
            'optional-features.json': strip`
            {
              "application-template-wrapper": ${testCase.expected}
            }
          `,
          },
          'it should have created the config file with the appropiate flags'
        );
      });

      QUnit.test(
        'it creates the config file if one does not already exists',
        async function (assert) {
          await run(testCase.command, 'application-template-wrapper', {
            input: 'no\n',
          });

          assert.deepEqual(
            project.read('config'),
            {
              'optional-features.json': strip`
            {
              "application-template-wrapper": ${testCase.expected}
            }
          `,
            },
            'it should have created the config file with the appropiate flags'
          );
        }
      );

      QUnit.test('it errors on invalid features', async function (assert) {
        let result = await run(testCase.command, 'foo-bar');

        assert.ok(
          result.stdout.indexOf('Error:') >= 0,
          'it should print an error'
        );
        assert.ok(
          stripAnsi(result.stdout).indexOf('foo-bar is not a valid feature') >=
            0,
          'it should print an error'
        );
      });

      QUnit.test('it errors on invalid ember version', async function (assert) {
        project.write({
          node_modules: {
            'ember-source': {
              'package.json': strip`
                {
                  "name": "ember-source",
                  "description": "",
                  "version": "3.0.0"
                }
              `,
            },
          },
        });

        let result = await run(
          testCase.command,
          'application-template-wrapper'
        );

        assert.ok(
          stripAnsi(result.stdout).indexOf('Error:') >= 0,
          'it should print an error'
        );
        assert.ok(
          stripAnsi(result.stdout).indexOf(
            'application-template-wrapper is only available in Ember 3.1.0 or above'
          ) >= 0,
          'it should print an error'
        );
      });

      QUnit.test(
        'it rewrites the config file if one already exists',
        async function (assert) {
          project.write({
            config: {
              'optional-features.json': strip(`
              {
                "template-only-glimmer-components": true
              }
            `),
            },
          });

          await run(testCase.command, 'application-template-wrapper', {
            input: 'no\n',
          });

          assert.deepEqual(
            project.read('config'),
            {
              'optional-features.json': strip`
            {
              "application-template-wrapper": ${testCase.expected},
              "template-only-glimmer-components": true
            }
          `,
            },
            'it should have rewritten the config file with the appropiate flags'
          );
        }
      );

      QUnit.test(
        'it rewrites the config file with a custom config path',
        async function (assert) {
          project.write({
            'package.json': strip`
            {
              "name": "dummy",
              "description": "",
              "version": "0.0.0",
              "devDependencies": {
                "@ember/optional-features": "*",
                "ember-cli": "*",
                "ember-source": "*"
              },
              "ember-addon": {
                "configPath": "foo/bar"
              }
            }
          `,
          });

          project.write(
            {
              'optional-features.json': strip(`
            {
              "template-only-glimmer-components": true
            }
          `),
            },
            'foo/bar'
          );

          await run(testCase.command, 'application-template-wrapper', {
            input: 'no\n',
          });

          assert.deepEqual(
            project.read('foo/bar'),
            {
              'optional-features.json': strip`
            {
              "application-template-wrapper": ${testCase.expected},
              "template-only-glimmer-components": true
            }
          `,
            },
            'it should have rewritten the config file with the appropiate flags'
          );
        }
      );
    });
  });

  QUnit.module('feature:disable application-template-wrapper', () => {
    QUnit.test(
      'it rewrites application.hbs without prompt when asked to',
      async function (assert) {
        project.write({
          app: {
            templates: {
              'application.hbs': strip`
              <ul>
                <li>One</li>
                <li>Two</li>
                <li>Three</li>
              </ul>

              {{outlet}}

              <!-- wow -->
            `,
            },
          },
        });

        await run(
          'feature:disable',
          'application-template-wrapper',
          '--run-codemod'
        );

        assert.deepEqual(
          project.read('app/templates'),
          {
            'application.hbs': strip`
          <div class="ember-view">
            <ul>
              <li>One</li>
              <li>Two</li>
              <li>Three</li>
            </ul>

            {{outlet}}

            <!-- wow -->
          </div>
        `,
          },
          'it should have rewritten the template with the wrapper'
        );
      }
    );

    QUnit.test(
      'it rewrites application.hbs when asked to',
      async function (assert) {
        project.write({
          app: {
            templates: {
              'application.hbs': strip`
              <ul>
                <li>One</li>
                <li>Two</li>
                <li>Three</li>
              </ul>

              {{outlet}}

              <!-- wow -->
            `,
            },
          },
        });

        await run('feature:disable', 'application-template-wrapper', {
          input: 'yes\n',
        });

        assert.deepEqual(
          project.read('app/templates'),
          {
            'application.hbs': strip`
          <div class="ember-view">
            <ul>
              <li>One</li>
              <li>Two</li>
              <li>Three</li>
            </ul>

            {{outlet}}

            <!-- wow -->
          </div>
        `,
          },
          'it should have rewritten the template with the wrapper'
        );
      }
    );

    QUnit.test(
      'it does not rewrite application.hbs when asked not to',
      async function (assert) {
        project.write({
          app: {
            templates: {
              'application.hbs': strip`
              <ul>
                <li>One</li>
                <li>Two</li>
                <li>Three</li>
              </ul>

              {{outlet}}

              <!-- wow -->
            `,
            },
          },
        });

        await run('feature:disable', 'application-template-wrapper', {
          input: 'no\n',
        });

        assert.deepEqual(
          project.read('app/templates'),
          {
            'application.hbs': strip`
          <ul>
            <li>One</li>
            <li>Two</li>
            <li>Three</li>
          </ul>

          {{outlet}}

          <!-- wow -->
        `,
          },
          'it should not have rewritten the template'
        );
      }
    );
  });

  QUnit.module('feature:enable template-only-glimmer-components', () => {
    const componentJS = strip(`
      import Component from '@ember/component';

      export default Component.extend({
      });
    `);

    const CLASSIC_BEFORE = {
      components: {
        'not-template-only.js': '/* do not touch */',
        'ts-not-template-only.ts': '/* do not touch */',
      },
      templates: {
        'not-component.hbs': '<!-- route template -->',
        components: {
          'foo-bar.hbs': '<!-- foo-bar -->',
          'another.hbs': '<!-- another -->',
          'not-template-only.hbs': '<!-- not-template-only -->',
          'ts-not-template-only.hbs': '<!-- not-template-only -->',
          'also-not-component.txt': 'This is not a component file.',
        },
      },
    };

    const CLASSIC_AFTER = {
      components: {
        'foo-bar.js': componentJS,
        'another.js': componentJS,
        'not-template-only.js': '/* do not touch */',
        'ts-not-template-only.ts': '/* do not touch */',
      },
      templates: {
        'not-component.hbs': '<!-- route template -->',
        components: {
          'foo-bar.hbs': '<!-- foo-bar -->',
          'another.hbs': '<!-- another -->',
          'not-template-only.hbs': '<!-- not-template-only -->',
          'ts-not-template-only.hbs': '<!-- not-template-only -->',
          'also-not-component.txt': 'This is not a component file.',
        },
      },
    };

    const PODS_BEFORE = {
      pods: {
        components: {
          'foo-bar': {
            'template.hbs': '<!-- foo-bar -->',
          },
          another: {
            'template.hbs': '<!-- another -->',
          },
          'also-not-component': {
            'something.txt': 'This is not a component file.',
          },
          'not-template-only': {
            'component.js': '/* do not touch */',
            'template.hbs': '<!-- not-template-only -->',
          },
          'ts-not-template-only': {
            'component.ts': '/* do not touch */',
            'template.hbs': '<!-- not-template-only -->',
          },
        },
        'not-component': {
          'template.hbs': '<!-- route template -->',
        },
      },
    };

    const PODS_AFTER = {
      pods: {
        components: {
          'foo-bar': {
            'component.js': componentJS,
            'template.hbs': '<!-- foo-bar -->',
          },
          another: {
            'component.js': componentJS,
            'template.hbs': '<!-- another -->',
          },
          'also-not-component': {
            'something.txt': 'This is not a component file.',
          },
          'not-template-only': {
            'component.js': '/* do not touch */',
            'template.hbs': '<!-- not-template-only -->',
          },
          'ts-not-template-only': {
            'component.ts': '/* do not touch */',
            'template.hbs': '<!-- not-template-only -->',
          },
        },
        'not-component': {
          'template.hbs': '<!-- route template -->',
        },
      },
    };

    const MIXED_BEFORE = {
      components: {
        'not-template-only-pods': {
          'component.js': '/* not-template-only-pods */',
          'template.hbs': '<!-- not-template-only-pods -->',
        },
        'template-only-pods': {
          'template.hbs': '<!-- template-only-pods -->',
        },
        'not-template-only.js': '/* not-template-only */',
      },
      pods: {
        components: {
          'not-template-only-pods-prefix': {
            'component.js': '/* not-template-only-pods-prefix */',
            'template.hbs': '<!-- not-template-only-pods-prefix -->',
          },
          'template-only-pods-prefix': {
            'template.hbs': '<!-- template-only-pods-prefix -->',
          },
        },
        'not-component-pods-prefix': {
          'template.hbs': '<!-- not-component-pods-prefix -->',
        },
      },
      templates: {
        components: {
          'not-template-only.hbs': '<!-- not-template-only -->',
          'template-only.hbs': '<!-- template-only -->',
        },
        'not-component.hbs': '<!-- not-component -->',
      },
    };

    const MIXED_AFTER = {
      components: {
        'not-template-only-pods': {
          'component.js': '/* not-template-only-pods */',
          'template.hbs': '<!-- not-template-only-pods -->',
        },
        'template-only-pods': {
          'component.js': componentJS,
          'template.hbs': '<!-- template-only-pods -->',
        },
        'not-template-only.js': '/* not-template-only */',
        'template-only.js': componentJS,
      },
      pods: {
        components: {
          'not-template-only-pods-prefix': {
            'component.js': '/* not-template-only-pods-prefix */',
            'template.hbs': '<!-- not-template-only-pods-prefix -->',
          },
          'template-only-pods-prefix': {
            'component.js': componentJS,
            'template.hbs': '<!-- template-only-pods-prefix -->',
          },
        },
        'not-component-pods-prefix': {
          'template.hbs': '<!-- not-component-pods-prefix -->',
        },
      },
      templates: {
        components: {
          'not-template-only.hbs': '<!-- not-template-only -->',
          'template-only.hbs': '<!-- template-only -->',
        },
        'not-component.hbs': '<!-- not-component -->',
      },
    };

    QUnit.test(
      'it generates component files when asked to',
      async function (assert) {
        project.write({ app: CLASSIC_BEFORE });

        await run('feature:enable', 'template-only-glimmer-components', {
          input: 'yes\n',
        });

        assert.deepEqual(
          project.read('app'),
          CLASSIC_AFTER,
          'it should have generated the component JS files'
        );
      }
    );

    QUnit.test(
      'it generates component files without prompt when asked to',
      async function (assert) {
        project.write({ app: CLASSIC_BEFORE });

        await run(
          'feature:enable',
          'template-only-glimmer-components',
          '--run-codemod'
        );

        assert.deepEqual(
          project.read('app'),
          CLASSIC_AFTER,
          'it should have generated the component JS files'
        );
      }
    );

    QUnit.test('it works for pods', async function (assert) {
      project.write({
        app: PODS_BEFORE,
        config: {
          'environment.js': `module.exports = function() {
            return {
              modulePrefix: 'my-app',
              podModulePrefix: 'my-app/pods',
            };
          };`,
        },
      });

      await run('feature:enable', 'template-only-glimmer-components', {
        input: 'yes\n',
      });

      assert.deepEqual(
        project.read('app'),
        PODS_AFTER,
        'it should have generated the component JS files'
      );
    });

    QUnit.test('it works for mixed layout apps', async function (assert) {
      project.write({
        app: MIXED_BEFORE,
        config: {
          'environment.js': `module.exports = function() {
            return {
              modulePrefix: 'my-app',
              podModulePrefix: 'my-app/pods',
            };
          };`,
        },
      });

      await run('feature:enable', 'template-only-glimmer-components', {
        input: 'yes\n',
      });

      assert.deepEqual(
        project.read('app'),
        MIXED_AFTER,
        'it should have generated the component JS files'
      );
    });

    QUnit.test(
      'it does not generates component files when asked not to',
      async function (assert) {
        project.write({ app: CLASSIC_BEFORE });

        await run('feature:enable', 'template-only-glimmer-components', {
          input: 'no\n',
        });

        assert.deepEqual(
          project.read('app'),
          CLASSIC_BEFORE,
          'it should have generated the component JS files'
        );
      }
    );

    QUnit.test(
      'it fails for missing `modulePrefix` when `podModulePrefix` is set',
      async function (assert) {
        project.write({
          app: PODS_BEFORE,
          config: {
            'environment.js': `module.exports = function() {
            return {
              podModulePrefix: 'my-app/pods',
            };
          };`,
          },
        });

        let result = await run(
          'feature:enable',
          'template-only-glimmer-components',
          { input: 'yes\n' }
        );

        assert.ok(
          result.stdout.includes(
            '`podModulePrefix` could not be processed correctly'
          )
        );
      }
    );
  });
});
