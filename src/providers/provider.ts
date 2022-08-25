import {CuepointTypeMap, CuePoint} from '../types';
import {CuePointManager} from '../cuepoint-manager';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

export interface ProviderRequest {
  loader: Function;
  params: any;
}
export class Provider {
  protected _types: Map<string, boolean>;
  protected _player: Player;
  protected _eventManager: EventManager;
  protected _logger: Logger;
  public cuePointManager: CuePointManager | null = null;

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    this._types = types;
    this._logger = logger;
    this._player = player;
    this._eventManager = eventManager;
    this._logger = logger;
  }

  protected _addCuePointToPlayer(cuePoints: any[]) {
    const playerCuePoints: CuePoint[] = cuePoints.map(cuePoint => {
      const {startTime, endTime, id, ...metadata} = cuePoint;
      return {startTime, endTime, id, metadata};
    });
    if (this._player.engineType === 'youtube') {
      if (!this.cuePointManager) {
        this.cuePointManager = new CuePointManager(this._player, this._eventManager);
      }
      this.cuePointManager.addCuePoints(playerCuePoints);
    } else {
      this._player.cuePointManager.addCuePoints(playerCuePoints);
    }
  }

  public destroy() {
    if (this.cuePointManager) {
      this.cuePointManager.destroy();
    }
  }
}
