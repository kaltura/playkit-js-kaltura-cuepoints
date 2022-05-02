import {CuepointService} from './cuepoint-service';
import {CuepointsConfig} from './types';
import Player = KalturaPlayerTypes.Player;

export class Cuepoints extends KalturaPlayer.core.BasePlugin {
  private _cuePointService: CuepointService;
  /**
   * The default configuration of the plugin.
   * @static
   */
  static defaultConfig: CuepointsConfig = {
    loadThumbnailWithKs: false
  };

  constructor(name: string, player: Player, config: CuepointsConfig) {
    super(name, player, config);

    this._cuePointService = new CuepointService(player, this.eventManager, this.logger, this.config);
    player.registerService('kalturaCuepoints', this._cuePointService);
  }

  reset() {
    this._cuePointService.reset();
  }

  destroy() {
    this.eventManager.destroy();
    this._cuePointService.reset();
  }

  /**
   * @static
   * @public
   * @returns {boolean} - Whether the plugin is valid.
   */
  static isValid(): boolean {
    return true;
  }
}
