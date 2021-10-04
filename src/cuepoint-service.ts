import Player = KalturaPlayerTypes.Player;
import {Provider} from './providers/provider';
import {VodProvider} from './providers/vod/vod-provider';
import {LiveProvider} from './providers/live/live-provider';
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

export enum KalturaThumbCuePointSubType {
  CHAPTER = 2,
  SLIDE = 1
}
export enum KalturaCuePointType {
  // All: 'All',
  // AnswersOnAir: 'AnswersOnAir',
  // Chapters: 'Chapters',
  SLIDE = 'slide'
  // Hotspots: 'Hotspots',
  // Captions: 'Captions'
}

export class CuepointService {
  private _types: Map<string, boolean> = new Map();
  private _provider: Provider | undefined;
  private _player: Player;
  private _logger: Logger;
  private _mediaLoaded: boolean = false;

  public get CuepointType() {
    return KalturaCuePointType;
  }

  constructor(player: Player, eventManager: EventManager, logger: any) {
    this._logger = logger;
    this._player = player;
    eventManager.listen(this._player, this._player.Event.CHANGE_SOURCE_ENDED, () => {
      this._initProvider();
    });
  }

  public registerTypes(types: KalturaCuePointType[]) {
    if (this._mediaLoaded) {
      this._logger.warn('Cue point registration should occur on loadMedia (or before)');
      return;
    }

    types.forEach((type: KalturaCuePointType) => {
      if (Object.values(KalturaCuePointType).includes(type)) {
        this._types.set(type, true);
      } else {
        this._logger.warn(`"${type}" is not a valid cue point type for registration`);
      }
    });
  }

  private _initProvider() {
    this._mediaLoaded = true;

    if (this._types.size == 0) {
      this._logger.warn('Cue points provider was not initialized because there are no registered types');

      return;
    }

    if (this._player.isLive()) {
      this._provider = new LiveProvider(this._player, this._logger, this._types);
    } else {
      this._provider = new VodProvider(this._player, this._logger, this._types);
    }
  }

  public reset(): void {
    this._mediaLoaded = false;
    this._types.clear();
    this._provider?.destroy();
  }
}
