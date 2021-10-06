import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import ILoader = KalturaPlayerTypes.ILoader;

export const DEFAULT_SERVICE_URL = '//cdnapisec.kaltura.com/api_v3';

export interface ProviderRequest {
  loader: Function;
  params: any;
}
export class Provider {
  protected _types: Map<string, boolean>;
  protected _player: Player;
  protected _eventManager: EventManager;
  protected _logger: Logger;
  protected _ks: string;
  protected _serviceUrl: string;

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: Map<string, boolean>) {
    this._types = types;
    this._logger = logger;
    this._player = player;
    this._eventManager = eventManager;
    this._logger = logger;
    this._ks = player.config.session?.ks || '';
    this._serviceUrl = this._player.config.provider.env?.serviceUrl || DEFAULT_SERVICE_URL;
  }

  public destroy() {}
}
