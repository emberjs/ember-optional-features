'use strict';

const CWD = process.cwd();

const fs = require('fs');
const co = require('co');
const createTempDir = require('broccoli-test-helper').createTempDir;
const execa = require('execa');
const mkdirp = require('mkdirp');
const p = require('path').join;

const FEATURES = require('../features');

function run(/*command, ...args */) {
  return execa.call(undefined, 'ember', [].slice.call(arguments));
}

function strip(string) {
  let lines = string.split('\n');

  while (lines[0].trim() === '') {
    lines.shift();
  }

  while (lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  let leading = lines[0].match(/^ */)[0];

  return lines.map(line => line.replace(leading, '')).join('\n') + '\n';
}

QUnit.module('commands', hooks => {
  let project;

  hooks.beforeEach(co.wrap(function *() {
    project = yield createTempDir();

    project.write({
      'package.json': strip(`
        {
          "name": "dummy",
          "description": "",
          "version": "0.0.0",
          "devDependencies": {
            "@ember/optional-features": "*",
            "ember-cli": "*"
          }
        }
      `)
    });

    process.chdir(project.path());

    mkdirp.sync(p(CWD, 'node_modules', '@ember'));
    fs.symlinkSync(p(CWD, 'node_modules'), p(project.path(), 'node_modules'));
    fs.symlinkSync(CWD, p(CWD, 'node_modules', '@ember', 'optional-features'));
  }));

  hooks.afterEach(co.wrap(function *() {
    process.chdir(CWD);
    yield project.dispose();
    fs.unlinkSync(p(CWD, 'node_modules', '@ember', 'optional-features'));
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
        yield run(testCase.command, 'application-template-wrapper');

        assert.deepEqual(project.read('config'), {
          'optional-features.json': strip(`
            {
              "application-template-wrapper": ${testCase.expected}
            }
          `)
        }, 'it should have created the config file with the appropiate flags');
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

        yield run(testCase.command, 'application-template-wrapper');

        assert.deepEqual(project.read('config'), {
          'optional-features.json': strip(`
            {
              "application-template-wrapper": ${testCase.expected},
              "template-only-glimmer-components": true
            }
          `)
        }, 'it should have rewritten the config file with the appropiate flags');
      }));
    });
  });
});
