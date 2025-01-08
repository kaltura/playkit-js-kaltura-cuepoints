import {Provider, ProviderRequest} from '../provider';
import {ThumbLoader} from '../common/thumb-loader';
import {KalturaQuizQuestionCuePoint, KalturaCodeCuePoint, KalturaCaption} from './response-types';
import {KalturaCuePointType, KalturaThumbCuePointSubType, CuepointTypeMap} from '../../types';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import KalturaCaptionSource = KalturaPlayerTypes.KalturaCaptionSource;
import {sortArrayBy} from '../utils';
import {ViewChangeLoader} from './view-change-loader';
import {QuizQuestionLoader} from './quiz-question-loader';
import {HotspotLoader} from '../common/hotspot-loader';
import {CaptionLoader} from './caption-loader';

export class VodProvider extends Provider {
  private _fetchedCaptionKeys: Array<string> = [];
  private _fetchingCaptionKey: string | null = null;

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._addListeners();
    this._fetchVodData();
  }

  private _addListeners() {
    if (this._types.has(KalturaCuePointType.CAPTION)) {
      // handle non-external text tracks (on init)
      this._eventManager.listenOnce(this._player, this._player.Event.TEXT_TRACK_ADDED, this._handleLanguageChange);
      // handle change of caption track
      this._eventManager.listen(this._player, this._player.Event.TEXT_TRACK_CHANGED, this._handleLanguageChange);
    }
  }

  private _removeListeners() {
    if (this._types.has(KalturaCuePointType.CAPTION)) {
      this._eventManager.unlisten(this._player, this._player.Event.TEXT_TRACK_ADDED, this._handleLanguageChange);
      this._eventManager.unlisten(this._player, this._player.Event.TEXT_TRACK_CHANGED, this._handleLanguageChange);
    }
  }

  private _fetchVodData() {
    let thumbSubTypesFilter = '';
    if (this._types.has(KalturaCuePointType.SLIDE)) {
      thumbSubTypesFilter = `${KalturaThumbCuePointSubType.SLIDE},`;
    }

    if (this._types.has(KalturaCuePointType.CHAPTER) && !this._types.has(KalturaCuePointType.SUMMARY)) {
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
            this._handleQuizQuestionResponse(data);
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

  private _handleLanguageChange = () => {
    const allTextTracks = this._player.getTracks(this._player.Track.TEXT) || [];
    const activeTextTrack = allTextTracks.find(track => track.active);
    const captionAssetList = this._player.sources.captions;
    if (activeTextTrack && Array.isArray(captionAssetList) && captionAssetList.length) {
      const captonAsset: KalturaCaptionSource =
        captionAssetList.find(captionAsset => {
          return captionAsset.language === activeTextTrack.language && captionAsset.label === activeTextTrack.label;
        }) || captionAssetList[0]; // get first caption asset if captions off
      this._loadCaptions(captonAsset);
    }
  };

  private _loadCaptions = (captonSource: KalturaCaptionSource) => {
    const captionKey = `${captonSource.language}-${captonSource.label}`;
    if (this._fetchedCaptionKeys.includes(captionKey) || this._fetchingCaptionKey === captionKey) {
      return; // prevent fetch captons if data already exist or fetching now
    }
    const match = captonSource.url.match('/captionAssetId/(.*?)(/|$)');
    if (!match || !match[1]) {
      return; // captionAssetId not found;
    }
    this._fetchingCaptionKey = captionKey;
    // as 'serveAsJson' action returns content of file it can't be included in multirequest that contains several responses.
    // to prevent add in multirequest 'startWidgetSession' action for anonymous users doRequest method takes a session ks.
    const {session} = this._player.config;
    const ks = session?.isAnonymous ? this._player.config.session.ks : undefined;
    this._player.provider
      .doRequest([{loader: CaptionLoader, params: {captionAssetId: match[1]}}], ks)
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
            cuePoints = this._filterAndShiftCuePoints(cuePoints);
            this._addCuePointToPlayer(cuePoints);
            // mark captions as fetched
            this._fetchedCaptionKeys.push(captionKey);
            // after captions are loaded, might need to manually push cue points
            this._maybeForcePushingCuePoints();
          }
        }
      })
      .catch((e: any) => {
        this._logger.warn(`Fetching captions ${captionKey} has failed`);
      })
      .finally(() => {
        this._fetchingCaptionKey = null;
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
          partnerData: viewChangeCuePoint.partnerData,
          tags: viewChangeCuePoint.tags
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
      lockedCuePoints = this._filterAndShiftCuePoints(lockedCuePoints);

      viewChangeCuePoints = sortArrayBy(viewChangeCuePoints, 'startTime');
      viewChangeCuePoints = this._fixCuePointsEndTime(viewChangeCuePoints);
      viewChangeCuePoints = this._filterAndShiftCuePoints(viewChangeCuePoints);

      this._addCuePointToPlayer(viewChangeCuePoints);
      this._addCuePointToPlayer(lockedCuePoints);
    }
  }

  private _handleQuizQuestionResponse(data: Map<string, any>) {
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
      cuePoints = this._filterAndShiftCuePoints(cuePoints);
      cuePoints = sortArrayBy(cuePoints, 'startTime', 'createdAt');
      this._addCuePointToPlayer(cuePoints);
    }
  }

  public destroy(): void {
    super.destroy();

    this._fetchedCaptionKeys = [];
    this._fetchingCaptionKey = null;
    this._removeListeners();
  }
}
