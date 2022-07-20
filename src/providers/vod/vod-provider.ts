import {Provider, ProviderRequest} from '../provider';
import {ThumbLoader} from './thumb-loader';
import {KalturaQuizQuestionCuePoint, KalturaThumbCuePoint, KalturaCodeCuePoint, KalturaHotspotCuePoint, KalturaCaption} from './response-types';
import {KalturaCuePointType, KalturaThumbCuePointSubType, CuepointTypeMap} from '../../types';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import KalturaCaptionSource = KalturaPlayerTypes.KalturaCaptionSource;
import {makeAssetUrl, generateThumb, sortArrayBy} from '../utils';
import {ViewChangeLoader} from './view-change-loader';
import {QuizQuestionLoader} from './quiz-question-loader';
import {HotspotLoader} from './hotspot-loader';
import {ThumbUrlLoader} from '../common/thumb-url-loader';
import {CaptionLoader} from './caption-loader';

export class VodProvider extends Provider {
  private _fetchedCaptionIndexes: Array<number> = [];

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._addListeners();
    this._fetchVodData();
  }

  private _addListeners() {
    if (this._types.has(KalturaCuePointType.CAPTION)) {
      this._eventManager.listen(this._player, this._player.Event.TEXT_TRACK_CHANGED, this._handleLanguageChange);
    }
  }

  private _removeListeners() {
    if (this._types.has(KalturaCuePointType.CAPTION)) {
      this._eventManager.unlisten(this._player, this._player.Event.TEXT_TRACK_CHANGED, this._handleLanguageChange);
    }
  }

  private _fetchVodData() {
    let thumbSubTypesFilter = '';
    if (this._types.has(KalturaCuePointType.SLIDE)) {
      thumbSubTypesFilter = `${KalturaThumbCuePointSubType.SLIDE},`;
    }

    if (this._types.has(KalturaCuePointType.CHAPTER)) {
      thumbSubTypesFilter += `${KalturaThumbCuePointSubType.CHAPTER},`;
    }

    let requests: Array<ProviderRequest> = [];
    if (thumbSubTypesFilter) {
      requests.push({loader: ThumbLoader, params: {entryId: this._player.sources.id, subTypesFilter: thumbSubTypesFilter}});
    }

    if (this._types.has(KalturaCuePointType.VIEW_CHANGE)) {
      requests.push({loader: ViewChangeLoader, params: {entryId: this._player.sources.id}});
    }

    if (this._types.has(KalturaCuePointType.QUIZ)) {
      requests.push({loader: QuizQuestionLoader, params: {entryId: this._player.sources.id}});
    }

    if (this._types.has(KalturaCuePointType.HOTSPOT)) {
      requests.push({loader: HotspotLoader, params: {entryId: this._player.sources.id}});
    }

    // if (this._types.has(KalturaCuePointType.AOA)) {} // AOA placeholder

    if (requests.length) {
      this._player.provider
        .doRequest(requests)
        .then((data: Map<string, any>) => {
          if (!data) {
            this._logger.warn("Provider cue points doRequest doesn't have data");
            return;
          }
          if (data.has(ThumbLoader.id)) {
            this._handleThumbResponse(data);
          }
          if (data.has(ViewChangeLoader.id)) {
            this._handleViewChangeResponse(data);
          }
          if (data.has(QuizQuestionLoader.id)) {
            this._handleQuizQustionResponse(data);
          }
          if (data.has(HotspotLoader.id)) {
            this._handleHotspotResponse(data);
          }
        })
        .catch((e: any) => {
          this._logger.warn('Provider cue points doRequest was rejected');
        });
    }
  }

  private _fixCuePointsEndTime<T extends {startTime: number; endTime: number}>(cuePoints: T[]) {
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

  private _handleLanguageChange = () => {
    const allTextTracks = this._player.getTracks(this._player.Track.TEXT) || [];
    const activeTextTrack = allTextTracks.find(track => track.active);
    const captionAssetList = this._player.sources.captions;
    if (activeTextTrack && Array.isArray(captionAssetList) && captionAssetList.length) {
      const captonAsset: KalturaCaptionSource = captionAssetList[activeTextTrack.index] || captionAssetList[0]; // get first caption asset if captions off
      this._loadCaptions(captonAsset, activeTextTrack.index);
    }
  };

  private _loadCaptions = (captonSource: KalturaCaptionSource, captionSourceIndex: number) => {
    if (this._fetchedCaptionIndexes.includes(captionSourceIndex)) {
      return; // prevent fetch captons if data already exist
    }
    const match = captonSource.url.match('/captionAssetId/(.*?)/');
    if (!match || !match[1]) {
      return; // captionAssetId not found;
    }
    this._player.provider
      .doRequest([{loader: CaptionLoader, params: {captionAssetId: match[1]}}])
      .then((data: Map<string, any>) => {
        if (!data) {
          this._logger.warn("CaptionLoader doRequest doesn't have data");
          return;
        }
        if (data.has(CaptionLoader.id)) {
          const captionLoader: CaptionLoader = data.get(CaptionLoader.id);
          const captions: KalturaCaption[] = captionLoader?.response.captions;
          if (captions.length) {
            let cuePoints = captions.map(caption => {
              return {
                ...caption,
                language: captonSource.language,
                label: captonSource.label,
                startTime: caption.startTime / 1000,
                endTime: caption.endTime / 1000,
                text: caption.content.reduce((acc, cur) => {
                  return `${acc}${cur.text}`;
                }, '')
              };
            });
            // filter empty captions
            cuePoints = cuePoints.filter(cue => cue.text);
            this._addCuePointToPlayer(cuePoints);
            // mark captions as fetched
            this._fetchedCaptionIndexes.push(captionSourceIndex);
          }
        }
      })
      .catch((e: any) => {
        this._logger.warn('CaptionLoader doRequest was rejected');
      });
  };

  private _handleViewChangeResponse(data: Map<string, any>) {
    function createCuePointList(viewChangeCuePoints: Array<KalturaCodeCuePoint>) {
      return viewChangeCuePoints.map((viewChangeCuePoint: KalturaCodeCuePoint) => {
        return {
          id: viewChangeCuePoint.id,
          startTime: viewChangeCuePoint.startTime / 1000,
          endTime: viewChangeCuePoint.endTime || Number.MAX_SAFE_INTEGER,
          cuePointType: viewChangeCuePoint.cuePointType,
          partnerData: viewChangeCuePoint.partnerData
        };
      });
    }
    const cuePointsLoader: ViewChangeLoader = data.get(ViewChangeLoader.id);
    const changeCuePoints: Array<KalturaCodeCuePoint> = cuePointsLoader?.response.viewChangeCuePoints || [];
    this._logger.debug(`_fetchVodData viewChange response successful with ${changeCuePoints.length} cue points`);

    if (changeCuePoints.length) {
      let cuePoints = createCuePointList(changeCuePoints);

      let {lockedCuePoints, viewChangeCuePoints} = cuePoints.reduce<any>(
        (prev: any, curr: any) => {
          if (curr.partnerData?.viewModeLockState) {
            return {lockedCuePoints: [...prev.lockedCuePoints, curr], viewChangeCuePoints: prev.viewChangeCuePoints};
          } else {
            return {lockedCuePoints: prev.lockedCuePoints, viewChangeCuePoints: [...prev.viewChangeCuePoints, curr]};
          }
        },
        {lockedCuePoints: [], viewChangeCuePoints: []}
      );

      lockedCuePoints = sortArrayBy(lockedCuePoints, 'startTime');
      lockedCuePoints = this._fixCuePointsEndTime(lockedCuePoints);

      viewChangeCuePoints = sortArrayBy(viewChangeCuePoints, 'startTime');
      viewChangeCuePoints = this._fixCuePointsEndTime(viewChangeCuePoints);

      this._addCuePointToPlayer(viewChangeCuePoints);
      this._addCuePointToPlayer(lockedCuePoints);
    }
  }

  private _handleThumbResponse(data: Map<string, any>) {
    const replaceAssetUrl = (baseThumbAssetUrl: string) => (thumbCuePoint: KalturaThumbCuePoint) => {
      return makeAssetUrl(baseThumbAssetUrl, thumbCuePoint.assetId);
    };
    const generageAssetUrl = (thumbCuePoint: KalturaThumbCuePoint) => {
      const {provider} = this._player.config;
      return generateThumb(provider?.env?.serviceUrl, provider?.partnerId, this._player.sources.id, thumbCuePoint.startTime, provider?.ks);
    };
    const addCuePoins = (thumbCuePoints: Array<KalturaThumbCuePoint>, assetUrlCreator: (thumbCuePoint: KalturaThumbCuePoint) => string) => {
      let cuePoints = thumbCuePoints.map((thumbCuePoint: KalturaThumbCuePoint) => {
        return {
          assetUrl: assetUrlCreator(thumbCuePoint),
          id: thumbCuePoint.id,
          cuePointType: thumbCuePoint.cuePointType,
          title: thumbCuePoint.title,
          description: thumbCuePoint.description,
          subType: thumbCuePoint.subType,
          startTime: thumbCuePoint.startTime / 1000,
          endTime: Number.MAX_SAFE_INTEGER
        };
      });
      cuePoints = sortArrayBy(cuePoints, 'startTime');
      cuePoints = this._fixCuePointsEndTime(cuePoints);
      this._addCuePointToPlayer(cuePoints);
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
                addCuePoins(slideCuePoints, replaceAssetUrl(baseThumbAssetUrl));
              }
              if (baseThumbAssetUrl && chapterCuePoints.length) {
                // if chapters has assetId - make assetUrl from baseAssetUrl otherwise - generate from media by startTime
                const chapterAssetUrlCreator = (thumbCuePoint: KalturaThumbCuePoint) => {
                  if (thumbCuePoint.assetId) {
                    // AssetUrl gonna be made by replacing assetId in baseAssetUrl
                    return replaceAssetUrl(baseThumbAssetUrl)(thumbCuePoint);
                  }
                  // AssetUrl gonna be made by BE service (snapshot from current media by time)
                  return generageAssetUrl(thumbCuePoint);
                };
                addCuePoins(chapterCuePoints, chapterAssetUrlCreator);
              }
            }
          })
          .catch((e: any) => {
            this._logger.warn('ThumbUrlLoader doRequest was rejected');
          });
      } else if (chapterCuePoints.length) {
        addCuePoins(chapterCuePoints, generageAssetUrl);
      }
    }
  }

  private _handleQuizQustionResponse(data: Map<string, any>) {
    const createCuePointList = (quizQuestionCuePoints: Array<KalturaQuizQuestionCuePoint>) => {
      return quizQuestionCuePoints.map((quizQuestionCuePoint: KalturaQuizQuestionCuePoint) => {
        const startTime = quizQuestionCuePoint.startTime / 1000;
        return {
          ...quizQuestionCuePoint,
          startTime,
          endTime: startTime + 0.5 // quiz cue-point duration 500ms (Safari needs at least 350ms to proper define active cue-points)
        };
      });
    };
    const quizQuestionCuePointsLoader: QuizQuestionLoader = data.get(QuizQuestionLoader.id);
    const quizQuestionCuePoints: Array<KalturaQuizQuestionCuePoint> = quizQuestionCuePointsLoader?.response.quizQuestionCuePoints || [];
    this._logger.debug(`_fetchVodData quiz question response successful with ${quizQuestionCuePoints.length} cue points`);
    if (quizQuestionCuePoints.length) {
      let cuePoints = createCuePointList(quizQuestionCuePoints);
      cuePoints = sortArrayBy(cuePoints, 'startTime', 'createdAt');
      this._addCuePointToPlayer(cuePoints);
    }
  }

  private _handleHotspotResponse(data: Map<string, any>) {
    const createCuePointList = (hotspotCuePoints: Array<KalturaHotspotCuePoint>) => {
      return hotspotCuePoints.map((hotspotCuePoint: KalturaHotspotCuePoint) => {
        return {
          id: hotspotCuePoint.id,
          cuePointType: hotspotCuePoint.cuePointType,
          text: hotspotCuePoint.text,
          partnerData: hotspotCuePoint.partnerData,
          startTime: hotspotCuePoint.startTime / 1000,
          endTime: hotspotCuePoint.endTime || Number.MAX_SAFE_INTEGER,
          tags: hotspotCuePoint.tags
        };
      });
    };
    const hotspotCuePointsLoader: HotspotLoader = data.get(HotspotLoader.id);
    const hotspotCuePoints: Array<KalturaHotspotCuePoint> = hotspotCuePointsLoader?.response.hotspotCuePoints || [];
    this._logger.debug(`_fetchVodData hotspots response successful with ${hotspotCuePoints.length} cue points`);
    if (hotspotCuePoints.length) {
      let cuePoints = createCuePointList(hotspotCuePoints);
      cuePoints = sortArrayBy(cuePoints, 'startTime', 'createdAt');
      this._addCuePointToPlayer(cuePoints);
    }
  }

  public destroy(): void {
    this._fetchedCaptionIndexes = [];
    this._removeListeners();
  }
}
