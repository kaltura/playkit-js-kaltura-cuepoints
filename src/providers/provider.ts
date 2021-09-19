import Player = KalturaPlayerTypes.Player;

export class Provider {
  protected _types: Map<string, boolean>;
  protected _player: Player;

  constructor(player: Player, types: Map<string, boolean>) {
    this._types = types;
    this._player = player;
  }

  public destroy = () => {};
}
