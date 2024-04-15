import {CuepointTypeMap, CuePoint, KalturaThumbCuePointSubType} from '../types';
import {CuePointManager} from '../cuepoint-manager';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import {KalturaHotspotCuePoint, KalturaThumbCuePoint} from './vod/response-types';
import {HotspotLoader, ThumbLoader, ThumbUrlLoader} from './common/';
import {makeAssetUrl, generateThumb, sortArrayBy} from './utils';
import {DataAggregator} from './dataAggregator';

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
  private _dataAggregator: DataAggregator | null = null;

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    this._types = types;
    this._logger = logger;
    this._player = player;
    this._eventManager = eventManager;
    this._logger = logger;
    if (this._useDataAggregator()) {
      // for live entry without DVR use additional processing of cues (filter out cues behind Live Edge)
      const onTimeoutFn = (collectedData: CuePoint[]) => {
        // filter out duplicates
        const collectedDataMap = new Map();
        collectedData.forEach(cuePoint => {
          collectedDataMap.set(cuePoint.id, cuePoint);
        });
        // for stream witout DVR filter out cues behind Live Edge
        collectedDataMap.forEach(cue => {
          if (cue.endTime === Number.MAX_SAFE_INTEGER) {
            this._player.cuePointManager.addCuePoints([cue]);
          }
        });
      };
      this._dataAggregator = new DataAggregator({onTimeoutFn});
    }
  }

  protected _addCuePointToPlayer(cuePoints: any[], useDataAggregator = Boolean(this._dataAggregator)) {
    if (!cuePoints.length) {
      return;
    }
    const playerCuePoints: CuePoint[] = cuePoints.map(cuePoint => {
      const {startTime, endTime, id, ...metadata} = cuePoint;
      return {startTime, endTime, id, metadata};
    });
    if (this._player.engineType === 'youtube') {
      if (!this.cuePointManager) {
        this.cuePointManager = new CuePointManager(this._player, this._eventManager);
      }
      this.cuePointManager.addCuePoints(playerCuePoints);
    } else if (useDataAggregator) {
      playerCuePoints.forEach(cuePoint => {
        this._dataAggregator!.addData(cuePoint);
      });
    } else {
      this._player.cuePointManager.addCuePoints(playerCuePoints);
    }
  }

  protected _addCuePointsData(cp: any[], useDataAggregator = false): void {
    this._addCuePointToPlayer(cp, useDataAggregator);
  }

  protected _shiftCuePoints(cuePoints: any[], seekFrom: number): void {
    cuePoints.forEach((cp: any) => {
      cp.startTime = cp.startTime - seekFrom;
      if (cp.endTime !== Number.MAX_SAFE_INTEGER) {
        cp.endTime = cp.endTime - seekFrom;
      }
    });
  }

  protected _filterCuePointsOutOfVideoRange(cuePoints: any[], seekFrom: number, clipTo: number | undefined): any[] {
    return cuePoints.filter((cp: any) => cp.startTime >= seekFrom && (!clipTo || cp.startTime < clipTo));
  }

  protected _filterAndShiftCuePoints(cuePoints: any[]): any[] {
    // TODO: add seekFrom and clipTo to player-config.d.ts file in kaltura-player
    // @ts-ignore
    const {seekFrom, clipTo} = this._player.sources;
    if (cuePoints.length && (seekFrom || clipTo)) {
      // video was clipped - the original cue-points times may not fit the new video
      // filter cue-points that are out of the clipped video range
      const filteredCuePoints = this._filterCuePointsOutOfVideoRange(cuePoints, seekFrom || 0, clipTo);
      // move the cue-points by adjusting their start and end times
      this._shiftCuePoints(filteredCuePoints, seekFrom || 0);
      return filteredCuePoints;
    }
    return cuePoints;
  }

  protected _fixCuePointsEndTime<T extends {startTime: number; endTime: number}>(cuePoints: T[]) {
    return cuePoints.map((cuePoint, index) => {
      if (cuePoint.endTime === Number.MAX_SAFE_INTEGER) {
        // aggregating cupoints with same startTime and setting them endTime of next future cuepoints
        let n = index + 1;
        while (cuePoints[n]) {
          if (cuePoints[n].startTime !== cuePoint.startTime) {
            return {
              ...cuePoint,
              endTime: cuePoints[n].startTime
            };
          }
          n++;
        }
      }
      return cuePoint;
    });
  }

  protected _handleThumbResponse(data: Map<string, any>, cuepointOffset: number = 0) {
    const replaceAssetUrl = (baseThumbAssetUrl: string) => (thumbCuePoint: KalturaThumbCuePoint) => {
      return makeAssetUrl(baseThumbAssetUrl, thumbCuePoint.assetId);
    };
    const generateAssetUrl = (thumbCuePoint: KalturaThumbCuePoint) => {
      const {provider} = this._player.config;
      return generateThumb(provider?.env?.serviceUrl, provider?.partnerId, this._player.sources.id, thumbCuePoint.startTime, provider?.ks);
    };
    const addCuePoints = (thumbCuePoints: Array<KalturaThumbCuePoint>, assetUrlCreator: (thumbCuePoint: KalturaThumbCuePoint) => string) => {
      let cuePoints = thumbCuePoints.map((thumbCuePoint: KalturaThumbCuePoint) => {
        return {
          assetUrl: assetUrlCreator(thumbCuePoint),
          id: thumbCuePoint.id,
          cuePointType: thumbCuePoint.cuePointType,
          title: thumbCuePoint.title,
          description: thumbCuePoint.description,
          subType: thumbCuePoint.subType,
          startTime: thumbCuePoint.startTime / 1000 + cuepointOffset,
          endTime: Number.MAX_SAFE_INTEGER,
          isDefaultThumb: !thumbCuePoint.assetId
        };
      });
      cuePoints = sortArrayBy(cuePoints, 'startTime');
      cuePoints = this._fixCuePointsEndTime(cuePoints);
      cuePoints = this._filterAndShiftCuePoints(cuePoints);
      this._addCuePointsData(cuePoints, false);
    };
    const thumbCuePointsLoader: ThumbLoader = data.get(ThumbLoader.id);
    const thumbCuePoints: Array<KalturaThumbCuePoint> = thumbCuePointsLoader?.response.thumbCuePoints || [];
    this._logger.debug(`_fetchVodData thumb response successful with ${thumbCuePoints.length} cue points`);
    if (thumbCuePoints.length) {
      const {slideCuePoints, chapterCuePoints} = thumbCuePoints.reduce(
        (acc, thumbCuePoint) => {
          if (thumbCuePoint.subType === KalturaThumbCuePointSubType.SLIDE) {
            return {...acc, slideCuePoints: [...acc.slideCuePoints, thumbCuePoint]};
          }
          if (thumbCuePoint.subType === KalturaThumbCuePointSubType.CHAPTER) {
            return {...acc, chapterCuePoints: [...acc.chapterCuePoints, thumbCuePoint]};
          }
          return acc;
        },
        {slideCuePoints: [], chapterCuePoints: []} as {slideCuePoints: Array<KalturaThumbCuePoint>; chapterCuePoints: Array<KalturaThumbCuePoint>}
      );
      // Find and use first thumb asset ID to get baseAssetUrl from BE service.
      // Then for each thumb assetId gonna be replaced in baseAssetUrl to avoid BE calls for any thumb asset.
      const firstAssetId = thumbCuePoints.find(thumb => thumb.assetId)?.assetId;
      if (firstAssetId) {
        // TODO: doRequest should get parameter 'requestsMustSucceed' once core implement the changes
        this._player.provider
          .doRequest([{loader: ThumbUrlLoader, params: {thumbAssetId: firstAssetId}}])
          .then((data: Map<string, any>) => {
            if (!data) {
              this._logger.warn("ThumbUrlLoader doRequest doesn't have data");
              return;
            }
            if (data.has(ThumbUrlLoader.id)) {
              const thumbAssetUrlLoader: ThumbUrlLoader = data.get(ThumbUrlLoader.id);
              const baseThumbAssetUrl: string = thumbAssetUrlLoader?.response;
              if (baseThumbAssetUrl && slideCuePoints.length) {
                addCuePoints(slideCuePoints, replaceAssetUrl(baseThumbAssetUrl));
              }
              if (baseThumbAssetUrl && chapterCuePoints.length) {
                // if chapters has assetId - make assetUrl from baseAssetUrl otherwise - generate from media by startTime
                const chapterAssetUrlCreator = (thumbCuePoint: KalturaThumbCuePoint) => {
                  if (thumbCuePoint.assetId) {
                    // AssetUrl gonna be made by replacing assetId in baseAssetUrl
                    return replaceAssetUrl(baseThumbAssetUrl)(thumbCuePoint);
                  }
                  // AssetUrl gonna be made by BE service (snapshot from current media by time)
                  return generateAssetUrl(thumbCuePoint);
                };
                addCuePoints(chapterCuePoints, chapterAssetUrlCreator);
              }
            }
          })
          .catch((e: any) => {
            this._logger.warn('ThumbUrlLoader doRequest was rejected');
          });
      } else if (chapterCuePoints.length) {
        addCuePoints(chapterCuePoints, generateAssetUrl);
      }
    }
  }

  protected _handleHotspotResponse(data: Map<string, any>, cuepointOffset: number = 0) {
    const createCuePointList = (hotspotCuePoints: Array<KalturaHotspotCuePoint>) => {
      return hotspotCuePoints.map((hotspotCuePoint: KalturaHotspotCuePoint) => {
        return {
          id: hotspotCuePoint.id,
          cuePointType: hotspotCuePoint.cuePointType,
          text: hotspotCuePoint.text,
          partnerData: hotspotCuePoint.partnerData,
          startTime: hotspotCuePoint.startTime / 1000 + cuepointOffset,
          endTime: hotspotCuePoint.endTime ? hotspotCuePoint.endTime / 1000 + cuepointOffset : Number.MAX_SAFE_INTEGER,
          tags: hotspotCuePoint.tags
        };
      });
    };
    const hotspotCuePointsLoader: HotspotLoader = data.get(HotspotLoader.id);
    let hotspotCuePoints: Array<KalturaHotspotCuePoint> = hotspotCuePointsLoader?.response.hotspotCuePoints || [];
    this._logger.debug(`_fetchVodData hotspots response successful with ${hotspotCuePoints.length} cue points`);
    if (hotspotCuePoints.length) {
      let cuePoints = createCuePointList(hotspotCuePoints);
      cuePoints = this._filterAndShiftCuePoints(cuePoints);
      cuePoints = sortArrayBy(cuePoints, 'startTime', 'createdAt');
      this._addCuePointsData(cuePoints, false);
    }
  }

  private _useDataAggregator() {
    return this._player.isLive() && !this._player.isDvr();
  }

  public destroy() {
    if (this.cuePointManager) {
      this.cuePointManager.destroy();
    }
    if (this._dataAggregator) {
      this._dataAggregator.destroy();
      this._dataAggregator = null;
    }
  }
}
