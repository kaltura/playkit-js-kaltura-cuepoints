import Player = KalturaPlayerTypes.Player;
import {Provider} from './providers/provider';
import {VodProvider} from './providers/vod-provider';
import {LiveProvider} from './providers/live-provider';
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

export class CuepointService {
  private _types: Map<string, boolean> = new Map();
  private _provider: Provider | undefined;
  private _player: Player;
  private _logger: Logger;
  private _mediaLoaded: boolean = false;
  public CuepointType: {[mode: string]: string} = {
    // All: 'All',
    // AnswersOnAir: 'AnswersOnAir',
    // Chapters: 'Chapters',
    SLIDE: 'slide'
    // Hotspots: 'Hotspots',
    // Captions: 'Captions'
  };

  constructor(player: Player, eventManager: EventManager, logger: any) {
    this._logger = logger;
    this._player = player;
    eventManager.listen(this._player, this._player.Event.CHANGE_SOURCE_ENDED, () => {
      this._initProvider();
    });
  }

  public registerTypes(types: string[]) {
    if (this._mediaLoaded) {
      this._logger.warn('Registration should occur on loadMedia (or before)');
      return;
    }

    types.forEach(type => {
      if (Object.values(this.CuepointType).includes(type)) {
        this._types.set(type, true);
      } else {
        this._logger.warn(`"${type}" is not a valid cue point type for registration`);
      }
    });
  }

  private _initProvider() {
    this._mediaLoaded = true;

    if (this._types.size == 0) {
      return;
    }

    if (this._player.isLive()) {
      this._provider = new LiveProvider(this._player, this._types);
    } else {
      this._provider = new VodProvider(this._player, this._types);
    }
  }

  public reset(): void {
    this._mediaLoaded = false;
    this._types.clear();
    this._provider?.destroy();
  }
}
