import {CuepointService} from './cuepoint-service';
import Player = KalturaPlayerTypes.Player;

export class Cuepoints extends KalturaPlayer.core.BasePlugin {
  private _cuePointService: CuepointService;
  /**
   * The default configuration of the plugin.
   * @static
   */
  static defaultConfig = {};

  constructor(name: string, player: Player) {
    super(name, player);

    this._cuePointService = new CuepointService(player, this.eventManager, this.logger);
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
