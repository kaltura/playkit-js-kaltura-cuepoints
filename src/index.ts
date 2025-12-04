import {Cuepoints} from './cuepoints';
import {registerPlugin} from '@playkit-js/kaltura-player-js';

declare var __VERSION__: string;
declare var __NAME__: string;

const VERSION = __VERSION__;
const NAME = __NAME__;

export {Cuepoints as Plugin};
export {VERSION, NAME};

const pluginName: string = 'kalturaCuepoints';
registerPlugin(pluginName, Cuepoints as any);
