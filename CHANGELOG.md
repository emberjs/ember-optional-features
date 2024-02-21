# Changelog

## Release (2024-02-21)

@ember/optional-features 2.1.0 (minor)

#### :rocket: Enhancement
* `@ember/optional-features`
  * [#334](https://github.com/emberjs/ember-optional-features/pull/334) Add feature for no-implicit-route-model - only effective from ember-source 5.7 ([@achambers](https://github.com/achambers))

#### :house: Internal
* `@ember/optional-features`
  * [#339](https://github.com/emberjs/ember-optional-features/pull/339) update release-plan ([@mansona](https://github.com/mansona))
  * [#337](https://github.com/emberjs/ember-optional-features/pull/337) Setup release plan ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#338](https://github.com/emberjs/ember-optional-features/pull/338) switch to npm ([@mansona](https://github.com/mansona))
  * [#335](https://github.com/emberjs/ember-optional-features/pull/335) Test against Node 16, 18, and 20 ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: 3
- Aaron Chambers ([@achambers](https://github.com/achambers))
- Chris Manson ([@mansona](https://github.com/mansona))
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)

## v2.0.0 (2020-08-27)

#### :boom: Breaking Change
* [#238](https://github.com/emberjs/ember-optional-features/pull/238) Drop Node 8 support. ([@rwjblue](https://github.com/rwjblue))

#### :rocket: Enhancement
* [#242](https://github.com/emberjs/ember-optional-features/pull/242) Update dependencies to latest versions. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#249](https://github.com/emberjs/ember-optional-features/pull/249) Drop util.promisify usage. ([@rwjblue](https://github.com/rwjblue))
* [#248](https://github.com/emberjs/ember-optional-features/pull/248) Re-roll yarn.lock. ([@rwjblue](https://github.com/rwjblue))
* [#247](https://github.com/emberjs/ember-optional-features/pull/247) Add prettier setup to eslint config. ([@rwjblue](https://github.com/rwjblue))
* [#245](https://github.com/emberjs/ember-optional-features/pull/245) Update linting package versions. ([@rwjblue](https://github.com/rwjblue))
* [#243](https://github.com/emberjs/ember-optional-features/pull/243) Update automated release setup. ([@rwjblue](https://github.com/rwjblue))
* [#240](https://github.com/emberjs/ember-optional-features/pull/240) Drop TravisCI (in favor of GitHub Actions) ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v1.3.0 (2019-12-19)

#### :rocket: Enhancement
* [#162](https://github.com/emberjs/ember-optional-features/pull/162) Add `--run-codemod` command line option. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#161](https://github.com/emberjs/ember-optional-features/pull/161) Remove co.wrap usage in favor of using async/await directly. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v1.2.0 (2019-12-16)

#### :bug: Bug Fix
* [#159](https://github.com/emberjs/ember-optional-features/pull/159) Fix command ignoring existing config in an addon ([@simonihmig](https://github.com/simonihmig))

#### Committers: 2
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)

## v1.1.0 (2019-10-23)

#### :rocket: Enhancement
* [#148](https://github.com/emberjs/ember-optional-features/pull/148) [FEATURE] Adds isFeatureExplicitlySet API ([@pzuraq](https://github.com/pzuraq))

#### Committers: 2
- Chris Garrett ([@pzuraq](https://github.com/pzuraq))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)

## v1.0.0 (2019-09-21)

#### :boom: Breaking Change
* [#95](https://github.com/emberjs/ember-optional-features/pull/95) Drop support for Node 6 ([@Turbo87](https://github.com/Turbo87))

#### :rocket: Enhancement
* [#132](https://github.com/emberjs/ember-optional-features/pull/132) Add default-async-observers optional feature. ([@rwjblue](https://github.com/rwjblue))
* [#97](https://github.com/emberjs/ember-optional-features/pull/97) template-only-glimmer-components: Add support for pods and mixed layouts ([@Turbo87](https://github.com/Turbo87))

#### :memo: Documentation
* [#34](https://github.com/emberjs/ember-optional-features/pull/34) Document API for reading features at build/run-time ([@bendemboski](https://github.com/bendemboski))

#### :house: Internal
* [#96](https://github.com/emberjs/ember-optional-features/pull/96) Update ESLint to v5.x ([@Turbo87](https://github.com/Turbo87))

#### Committers: 4
- Ben Demboski ([@bendemboski](https://github.com/bendemboski))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)

