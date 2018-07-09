'use strict';

const CWD = process.cwd();

const fs = require('fs');
const co = require('co');
const createTempDir = require('broccoli-test-helper').createTempDir;
const execa = require('execa');
const mkdirp = require('mkdirp');
const p = require('path').join;
const strip = require('../fmt').strip;

const FEATURES = require('../features');

function run(/*command, ...args, options */) {
  let args = [].slice.call(arguments);
  let options = {};

  if (typeof args[args.length - 1] === 'object') {
    options = args.pop();
  }

  return execa('ember', args, options);
}

QUnit.module('commands', hooks => {
  let project;

  hooks.beforeEach(co.wrap(function *() {
    project = yield createTempDir();

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
      `
    });

    process.chdir(project.path());

    mkdirp.sync(p(CWD, 'node_modules', '@ember'));
    fs.symlinkSync(p(CWD, 'node_modules'), p(project.path(), 'node_modules'));
    fs.symlinkSync(CWD, p(CWD, 'node_modules', '@ember', 'optional-features'));

    mkdirp.sync(p(CWD, 'node_modules', 'ember-source'));
    fs.writeFileSync(p(CWD, 'node_modules', 'ember-source', 'package.json'), strip`
      {
        "name": "ember-source",
        "description": "",
        "version": "9.9.9"
      }
    `, { encoding: 'UTF-8' });
  }));

  hooks.afterEach(co.wrap(function *() {
    process.chdir(CWD);
    yield project.dispose();
    fs.unlinkSync(p(CWD, 'node_modules', '@ember', 'optional-features'));
    fs.unlinkSync(p(CWD, 'node_modules', 'ember-source', 'package.json'));
  }));

  function USAGE(command) {
    QUnit.test(`it prints the USAGE message`, co.wrap(function *(assert) {
      let result = yield run(command);

      assert.ok(result.stdout.indexOf('Usage:') >= 0, 'it should print the USAGE message');
    }));
  }

  QUnit.module('feature', () => {
    USAGE('feature');
  });

  QUnit.module('feature:list', () => {
    USAGE('feature:list');

    QUnit.test(`it lists all the available features`, co.wrap(function *(assert) {
      let result = yield run('feature:list');

      assert.ok(result.stdout.indexOf('Available features:') >= 0, 'it list the available features');

      Object.keys(FEATURES).forEach(key => {
        let feature = FEATURES[key];

        assert.ok(result.stdout.indexOf(`${key} (Default: ${feature.default}`) >= 0, `it should include ${key} and its default value`);
        assert.ok(result.stdout.indexOf(feature.description) >= 0, `it should include the description for ${key}`);
        assert.ok(result.stdout.indexOf(feature.url) >= 0, `it should include the URL for ${key}`);
      });
    }));
  });

  [
    {
      command: 'feature:enable',
      expected: true
    }, {
      command: 'feature:disable',
      expected: false
    }
  ].forEach(testCase => {
    QUnit.module(testCase.command, () => {
      QUnit.test('it creates the config file if one does not already exists', co.wrap(function *(assert) {
        yield run(testCase.command, 'application-template-wrapper', { input: 'no\n' });

        assert.deepEqual(project.read('config'), {
          'optional-features.json': strip`
            {
              "application-template-wrapper": ${testCase.expected}
            }
          `
        }, 'it should have created the config file with the appropiate flags');
      }));

      QUnit.test('it errors on invalid features', co.wrap(function *(assert) {
        let result = yield run(testCase.command, 'foo-bar');

        assert.ok(result.stdout.indexOf('Error:') >= 0, 'it should print an error');
        assert.ok(result.stdout.indexOf('foo-bar is not a valid feature') >= 0, 'it should print an error');
      }));

      QUnit.test('it errors on invalid ember version', co.wrap(function *(assert) {
        project.write({
          'node_modules': {
            'ember-source': {
              'package.json': strip`
                {
                  "name": "ember-source",
                  "description": "",
                  "version": "3.0.0"
                }
              `
            }
          }
        });

        let result = yield run(testCase.command, 'application-template-wrapper');

        assert.ok(result.stdout.indexOf('Error:') >= 0, 'it should print an error');
        assert.ok(result.stdout.indexOf('application-template-wrapper is only available in Ember 3.1.0 or above') >= 0, 'it should print an error');
      }));

      QUnit.test('it rewrites the config file if one already exists', co.wrap(function *(assert) {
        project.write({
          config: {
            'optional-features.json': strip(`
              {
                "template-only-glimmer-components": true
              }
            `)
          }
        });

        yield run(testCase.command, 'application-template-wrapper', { input: 'no\n' });

        assert.deepEqual(project.read('config'), {
          'optional-features.json': strip`
            {
              "application-template-wrapper": ${testCase.expected},
              "template-only-glimmer-components": true
            }
          `
        }, 'it should have rewritten the config file with the appropiate flags');
      }));
    });
  });

  QUnit.module('feature:disable application-template-wrapper', () => {
    QUnit.test('it rewrites application.hbs when asked to', co.wrap(function *(assert) {
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
            `
          }
        }
      });

      yield run('feature:disable', 'application-template-wrapper', { input: 'yes\n' });

      assert.deepEqual(project.read('app/templates'), {
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
        `
      }, 'it should have rewritten the template with the wrapper');
    }));

    QUnit.test('it does not rewrite application.hbs when asked not to', co.wrap(function *(assert) {
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
            `
          }
        }
      });

      yield run('feature:disable', 'application-template-wrapper', { input: 'no\n' });

      assert.deepEqual(project.read('app/templates'), {
        'application.hbs': strip`
          <ul>
            <li>One</li>
            <li>Two</li>
            <li>Three</li>
          </ul>

          {{outlet}}

          <!-- wow -->
        `
      }, 'it should not have rewritten the template');
    }));
  });

  QUnit.module('feature:enable template-only-glimmer-components', () => {
    QUnit.test('it generates component files when asked to', co.wrap(function *(assert) {
      project.write({
        app: {
          components: {
            'not-template-only.js': '/* do not touch */',
            'ts-not-template-only.ts': '/* do not touch */'
          },
          templates: {
            'not-component.hbs': '<!-- route template -->',
            components: {
              'foo-bar.hbs': '<!-- foo-bar -->',
              'another.hbs': '<!-- another -->',
              'not-template-only.hbs': '<!-- not-template-only -->',
              'ts-not-template-only.hbs': '<!-- not-template-only -->',
              'also-not-component.txt': 'This is not a component file.'
            }
          }
        }
      });

      yield run('feature:enable', 'template-only-glimmer-components', { input: 'yes\n' });

      let componentJS = strip(`
        import Component from '@ember/component';

        export default Component.extend({
        });
      `);

      assert.deepEqual(project.read('app'), {
        components: {
          'foo-bar.js': componentJS,
          'another.js': componentJS,
          'not-template-only.js': '/* do not touch */',
          'ts-not-template-only.ts': '/* do not touch */'
        },
        templates: {
          'not-component.hbs': '<!-- route template -->',
          components: {
            'foo-bar.hbs': '<!-- foo-bar -->',
            'another.hbs': '<!-- another -->',
            'not-template-only.hbs': '<!-- not-template-only -->',
            'ts-not-template-only.hbs': '<!-- not-template-only -->',
            'also-not-component.txt': 'This is not a component file.'
          }
        }
      }, 'it should have generated the component JS files');
    }));

    QUnit.test('it does not generates component files when asked not to', co.wrap(function *(assert) {
      project.write({
        app: {
          components: {
            'not-template-only.js': '/* do not touch */'
          },
          templates: {
            'not-component.hbs': '<!-- route template -->',
            components: {
              'foo-bar.hbs': '<!-- foo-bar -->',
              'another.hbs': '<!-- another -->',
              'not-template-only.hbs': '<!-- not-template-only -->',
              'also-not-component.txt': 'This is not a component file.'
            }
          }
        }
      });

      yield run('feature:enable', 'template-only-glimmer-components', { input: 'no\n' });

      assert.deepEqual(project.read('app'), {
        components: {
          'not-template-only.js': '/* do not touch */'
        },
        templates: {
          'not-component.hbs': '<!-- route template -->',
          components: {
            'foo-bar.hbs': '<!-- foo-bar -->',
            'another.hbs': '<!-- another -->',
            'not-template-only.hbs': '<!-- not-template-only -->',
            'also-not-component.txt': 'This is not a component file.'
          }
        }
      }, 'it should have generated the component JS files');
    }));
  });
});
