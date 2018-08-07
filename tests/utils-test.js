'use strict';

const utils = require('../utils');
const join = utils.join;
const strip = utils.strip;

QUnit.module('utils', () => {
  QUnit.test('join', assert => {
    assert.equal(join``, ``);
    assert.equal(join`hello world`, `hello world`);
    assert.equal(join`h${"E"}l${"L"}o${" "}w${"O"}r${"L"}d`, `h${"E"}l${"L"}o${" "}w${"O"}r${"L"}d`);
    assert.equal(join`
      wow

         ${"such"}

very

    ${"amaze"}`, `
      wow

         ${"such"}

very

    ${"amaze"}`);
  });

  QUnit.test('strip', assert => {
    assert.equal(strip``, ``);
    assert.equal(strip`hello world`, `hello world`);
    assert.equal(strip`h${"E"}l${"L"}o${" "}w${"O"}r${"L"}d`, `h${"E"}l${"L"}o${" "}w${"O"}r${"L"}d`);

    assert.equal(strip`\n`, '');
    assert.equal(strip`  \n  `, '\n');
    assert.equal(strip`      `, '');

    assert.equal(strip`
      <!doctype html>
      <html>
        <head>
          <title>Hello world</title>
        </head>
        <body>
          <h1>Hello world</h1>

          <pre>
        wow

           such

      very

          amaze
          </pre>

        </body>
      </html>
    `,
      '<!doctype html>\n' +
      '<html>\n' +
      '  <head>\n' +
      '    <title>Hello world</title>\n' +
      '  </head>\n' +
      '  <body>\n' +
      '    <h1>Hello world</h1>\n' +
      '\n' +
      '    <pre>\n' +
      '  wow\n' +
      '\n' +
      '     such\n' +
      '\n' +
      'very\n' +
      '\n' +
      '    amaze\n' +
      '    </pre>\n' +
      '\n' +
      '  </body>\n' +
      '</html>\n'
    );
  });
});
