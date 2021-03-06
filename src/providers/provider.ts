import {CuepointTypeMap} from '../types';
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

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    this._types = types;
    this._logger = logger;
    this._player = player;
    this._eventManager = eventManager;
    this._logger = logger;
  }

  protected _addCuePointToPlayer(cuePoints: any[]) {
    const playerCuePoints = cuePoints.map(cuePoint => {
      const {startTime, endTime, id, ...metadata} = cuePoint;
      return {startTime, endTime, id, metadata};
    });
    this._player.cuePointManager.addCuePoints(playerCuePoints);
  }

  public destroy() {}
}
