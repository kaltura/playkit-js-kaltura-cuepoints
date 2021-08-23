/// <reference path="./global.d.ts" />

import {Cuepoints} from './cuepoints';

declare var __VERSION__: string;
declare var __NAME__: string;

const VERSION = __VERSION__;
const NAME = __NAME__;

export {Cuepoints as Plugin};
export {VERSION, NAME};

const pluginName: string = 'cuepoints';
KalturaPlayer.core.registerPlugin(pluginName, Cuepoints);
