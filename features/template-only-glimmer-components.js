/* eslint-disable no-console */
'use strict';

const { styleText } = require('node:util');
const fs = require('fs');
const globSync = require('glob').globSync;
const mkdirp = require('mkdirp');
const p = require('util').promisify;
const path = require('path');
const strip = require('../utils').strip;

const ComponentFile = strip`
  import Component from '@ember/component';

  export default Component.extend({
  });
`;

/* This forces strip`` to start counting the indentaton */
const INDENT_START = '';

module.exports = {
  description:
    'Use Glimmer Components semantics for template-only components (component templates with no corresponding .js file).',
  url: 'https://github.com/emberjs/rfcs/pull/278',
  default: false,
  since: '3.1.0',
  callback: async function (project, value, shouldRunCodemod) {
    if (value !== true) {
      return;
    }

    let root = project.root;
    let projectConfig = project.config();

    let { modulePrefix, podModulePrefix } = projectConfig;
    let podsFolder;
    if (podModulePrefix) {
      if (!modulePrefix || !podModulePrefix.startsWith(`${modulePrefix}/`)) {
        console.log(
          styleText(
            'yellow',
            `${styleText(
              'bold',
              'Note:'
            )} There is an automated refactor script available for this feature, but your \`podModulePrefix\` could not be processed correctly.\n`
          )
        );
        return;
      }

      podsFolder = podModulePrefix.slice(modulePrefix.length + 1);
      if (!podsFolder) {
        console.log(
          styleText(
            'yellow',
            `${styleText(
              'bold',
              'Note:'
            )} There is an automated refactor script available for this feature, but your \`podModulePrefix\` could not be processed correctly.\n`
          )
        );
        return;
      }
    }

    let templates = [];
    let components = [];

    // Handle "Classic" layout
    let templatesRoot = path.join(root, 'app/templates/components');
    let templateCandidates = globSync('**/*.hbs', { cwd: templatesRoot });

    templateCandidates.forEach((template) => {
      let templatePath = path.join('app/templates/components', template);

      let jsPath = path.join(
        'app/components',
        template.replace(/\.hbs$/, '.js')
      );
      if (fs.existsSync(path.join(root, jsPath))) return;

      let tsPath = path.join(
        'app/components',
        template.replace(/\.hbs$/, '.ts')
      );
      if (fs.existsSync(path.join(root, tsPath))) return;

      templates.push(templatePath);
      components.push(jsPath); // Always offer to create JS
    });

    // Handle "Pods" layout without prefix

    let componentsRoot = path.join(root, 'app/components');
    templateCandidates = globSync('**/template.hbs', {
      cwd: componentsRoot,
    });

    templateCandidates.forEach((template) => {
      let templatePath = path.join('app/components', template);

      let jsPath = path.join(
        'app/components',
        template.replace(/template\.hbs$/, 'component.js')
      );
      if (fs.existsSync(path.join(root, jsPath))) return;

      let tsPath = path.join(
        'app/components',
        template.replace(/template\.hbs$/, 'component.ts')
      );
      if (fs.existsSync(path.join(root, tsPath))) return;

      templates.push(templatePath);
      components.push(jsPath); // Always offer to create JS
    });

    // Handle "Pods" layout *with* prefix

    componentsRoot = path.join(root, `app/${podsFolder}/components`);
    templateCandidates = globSync('**/template.hbs', {
      cwd: componentsRoot,
    });

    templateCandidates.forEach((template) => {
      let templatePath = path.join(`app/${podsFolder}/components`, template);

      let jsPath = path.join(
        `app/${podsFolder}/components`,
        template.replace(/template\.hbs$/, 'component.js')
      );
      if (fs.existsSync(path.join(root, jsPath))) return;

      let tsPath = path.join(
        `app/${podsFolder}/components`,
        template.replace(/template\.hbs$/, 'component.ts')
      );
      if (fs.existsSync(path.join(root, tsPath))) return;

      templates.push(templatePath);
      components.push(jsPath); // Always offer to create JS
    });

    if (templates.length === 0) {
      return;
    }

    if (shouldRunCodemod === undefined) {
      console.log(strip`
        Enabling ${styleText('bold', 'template-only-glimmer-components')}...

        This will change the semantics for template-only components (components without a \`.js\` file).

        Some notable differences include...

          - They will not have a component instance, so statements like \`{{this}}\`, \`{{this.foo}}\` and \`{{foo}}\` will be \`null\` or \`undefined\`.

          - They will not have a wrapper element: what you have in the template will be what is rendered on the screen.

          - Passing classes in the invocation (i.e. \`{{my-component class="..."}}\`) will not work, since there is no wrapper element to apply the classes to.

        For more information, see ${styleText(
          'underline',
          'https://github.com/emberjs/rfcs/pull/278'
        )}.

        While these changes may be desirable for ${styleText(
          'italic',
          'new components'
        )}, they may unexpectedly break the styling or runtime behavior of your ${styleText(
        'italic',
        'existing components'
      )}.

        To be conservative, it is recommended that you add a \`.js\` file for existing template-only components. (You can always delete them later if you aren't relying on the differences.)

        The following components are affected:`);

      for (let i = 0; i < templates.length; i++) {
        console.log(strip`
        ${INDENT_START}
          - ${styleText('underline', templates[i])}
            ${styleText(
              'gray',
              `(Recommendation: add ${styleText(
                'cyan',
                styleText('underline', components[i])
              )})`
            )}
        `);
      }
      const prompt = require('inquirer').createPromptModule();
      let response = await prompt({
        type: 'confirm',
        name: 'shouldGenerate',
        message: 'Would you like me to generate these component files for you?',
        default: true,
      });

      shouldRunCodemod = response.shouldGenerate;

      console.log();
    }

    if (shouldRunCodemod) {
      for (let i = 0; i < components.length; i++) {
        let componentPath = components[i];
        console.log(`  ${styleText('green', 'create')} ${componentPath}`);
        let absolutePath = path.join(project.root, componentPath);
        await mkdirp(path.dirname(absolutePath));
        await p(fs.writeFile)(absolutePath, ComponentFile, {
          encoding: 'UTF-8',
        });
      }

      console.log();
    }
  },
};
