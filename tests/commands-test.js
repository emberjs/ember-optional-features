'use strict';

const CWD = process.cwd();

const fs = require('fs');
const co = require('co');
const createTempDir = require('broccoli-test-helper').createTempDir;
const execa = require('execa');
const mkdirp = require('mkdirp');
const p = require('path').join;

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
                "template-only-component-wrapper": false
              }
            `)
          }
        });

        yield run(testCase.command, 'application-template-wrapper');

        assert.deepEqual(project.read('config'), {
          'optional-features.json': strip(`
            {
              "application-template-wrapper": ${testCase.expected},
              "template-only-component-wrapper": false
            }
          `)
        }, 'it should have rewritten the config file with the appropiate flags');
      }));
    });
  });
});
