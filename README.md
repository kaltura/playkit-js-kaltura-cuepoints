# PlayKit JS Kaltura Cuepoints - plugin for the [PlayKit JS Player]


[![Build Status](https://github.com/kaltura/playkit-js-kaltura-cuepoints/actions/workflows/run_canary_full_flow.yaml/badge.svg)](https://github.com/kaltura/playkit-js-kaltura-cuepoints/actions/workflows/run_canary_full_flow.yaml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![](https://img.shields.io/npm/v/@playkit-js/playkit-js-kaltura-cuepoints/latest.svg)](https://www.npmjs.com/package/@playkit-js/playkit-js-kaltura-cuepoints)
[![](https://img.shields.io/npm/v/@playkit-js/playkit-js-kaltura-cuepoints/canary.svg)](https://www.npmjs.com/package/@playkit-js/playkit-js-kaltura-cuepoints/v/canary)

PlayKit JS Kaltura Cuepoints enables to register to one or more cue point type and receive the entry cue points

PlayKit JS Kaltura Cuepoints is written in [ECMAScript6], statically analysed using [Typescript] and transpiled in ECMAScript5 using [Babel].

[typescript]: https://www.typescriptlang.org/
[ecmascript6]: https://github.com/ericdouglas/ES6-Learning#articles--tutorials
[babel]: https://babeljs.io

## Getting Started

### Prerequisites

The plugin requires [Kaltura Player] to be loaded first.

[kaltura player]: https://github.com/kaltura/kaltura-player-js

### Installing

First, clone and run [yarn] to install dependencies:

[yarn]: https://yarnpkg.com/lang/en/

```
git clone https://github.com/kaltura/playkit-js-kaltura-cuepoints.git
cd playkit-js-kaltura-cuepoints
yarn install
```

### Building

Then, build the player

```javascript
yarn run build
```

### Embed the library in your test page

Finally, add the bundle as a script tag in your page, and initialize the player

```html
<script type="text/javascript" src="/PATH/TO/FILE/kaltura-player.js"></script>
<!--Kaltura player-->
<script type="text/javascript" src="/PATH/TO/FILE/playkit-kaltura-cuepoints.js"></script>
<!--PlayKit cuepoints plugin-->
<div id="player-placeholder" style="height:360px; width:640px">
  <script type="text/javascript">
    var playerContainer = document.querySelector("#player-placeholder");
    var config = {
     ...
     targetId: 'player-placeholder',
     plugins: {
      kalturaCuepoints: { ... },
     }
     ...
    };
    var player = KalturaPlayer.setup(config);
    player.loadMedia(...);
  </script>
</div>
```

### And coding style tests

We use ESLint [recommended set](http://eslint.org/docs/rules/) with some additions for enforcing [Flow] types and other rules.

See [ESLint config](.eslintrc.json) for full configuration.

We also use [.editorconfig](.editorconfig) to maintain consistent coding styles and settings, please make sure you comply with the styling.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/kaltura/playkit-js-kaltura-cuepoints/tags).

## License

All code in this project is released under the [AGPLv3 license](http://www.gnu.org/licenses/agpl-3.0.html) unless a different license for a particular library is specified in the applicable library path.

Copyright © Kaltura Inc. All rights reserved.  
Authors and contributors: See [GitHub contributors list](https://github.com/kaltura/playkit-js-kaltura-cuepoints/graphs/contributors).

## Commands

Run dev server: `yarn dev`;<br/>
Bump version: `yarn release`;<br/>

### Dev env
Node version: up to 14+<br/>
If nvm installed: `nvm use` change version of current terminal to required.<br/>
