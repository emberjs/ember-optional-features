# @ember/optional-features

This addon allows you to easily enable/disable optional features in ember-source canary. It is intended for use with apps *only* not addons.

## Installation

```bash
ember install @ember/optional-features
```

## Usage

### List available features

Features will only be available in canary builds of ember-source. To list all available features run:

```bash
ember feature:list
```

### Enable/disable features

To enable a feature, run:

```bash
ember feature:enable some-feature
```

Similarly, if you want to disable a feature, you can run:

```bash
ember feature:disable some-feature
```

### Installing ember-source canary

You will first need to go find the latest sha for Ember on the master branch, which you can copy from [here](https://github.com/emberjs/ember.js/commits/master).

Then, you need to run:

```bash
yarn add -D ember-source@http://builds.emberjs.com/canary/shas/<your-sha-here>.tgz
```

Of course, you will want to replace `<your-sha-here>` with the sha you copied.
