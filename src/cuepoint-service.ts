import {Provider} from './provider';
import Player = KalturaPlayerTypes.Player;

export class CuepointService {
  private _types: Map<string, boolean> = new Map();
  private _provider: Provider;
  private _player: Player;

  constructor(player: Player) {
    this._player = player;
  }

  public register(type: string) {
    if (!this._types.has(type)) {
      this._types.set();
    }
    if (islive) {
      this._provider = new LiveProvider();
    } else {
      this._provider = new VODProvider();
    }
  }
}

export enum types {
  All = 'All',
  AnswersOnAir = 'AnswersOnAir',
  Chapters = 'Chapters',
  Slides = 'Slides',
  Hotspots = 'Hotspots',
  Captions = 'Captions'
}
