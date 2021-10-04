/// <reference path="../node_modules/kaltura-player-js/ts-typed/kaltura-player.d.ts" />
/// <reference path="./global-types/kaltura-cue-points.d.ts" />

declare module '*.scss' {
  const content: {[className: string]: string};
  export = content;
}
