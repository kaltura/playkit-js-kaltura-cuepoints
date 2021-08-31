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
    this._cuePointService = new CuepointService(player);
    player.registerService('cuepoints', this._cuePointService);
  }

  loadMedia(): void {
    if (this.player.isLive()) {
      this._cuePointService.registerToPushServer();
    } else {
      this._cuePointService.fetchVodData();
    }
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
