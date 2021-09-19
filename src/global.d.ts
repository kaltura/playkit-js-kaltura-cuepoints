/// <reference path="../node_modules/kaltura-player-js/ts-typed/kaltura-player.d.ts" />

declare module '*.scss' {
  const content: {[className: string]: string};
  export = content;
}
