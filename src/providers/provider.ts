import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import ILoader = KalturaPlayerTypes.ILoader;

export interface ProviderRequest {
  loader: Function,
  params: any
}
export class Provider {
  protected _types: Map<string, boolean>;
  protected _player: Player;
  protected _logger: Logger;

  constructor(player: Player, logger: Logger, types: Map<string, boolean>) {
    this._types = types;
    this._logger = logger;
    this._player = player;
  }

  public destroy = () => {};
}
