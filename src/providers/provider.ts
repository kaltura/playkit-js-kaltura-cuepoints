import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

export class Provider {
  protected _types: Map<string, boolean>;
  protected _player: Player;
  protected _eventManager: EventManager;
  protected _logger: Logger;

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: Map<string, boolean>) {
    this._types = types;
    this._player = player;
    this._eventManager = eventManager;
    this._logger = logger;
  }

  public destroy() {}
}
