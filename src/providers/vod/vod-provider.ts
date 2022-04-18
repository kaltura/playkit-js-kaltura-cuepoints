import {Provider, ProviderRequest} from '../provider';
import {ThumbLoader} from './thumb-loader';
import {KalturaQuizQuestionCuePoint, KalturaThumbCuePoint, KalturaCodeCuePoint} from './response-types';
import {KalturaCuePointType, KalturaThumbCuePointSubType, CuepointTypeMap} from '../../types';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import {makeAssetUrl, sortArrayBy, isSafari} from '../utils';
import {ViewChangeLoader} from './view-change-loader';
import {QuizQuestionLoader} from './quiz-question-loader';

export class VodProvider extends Provider {
  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._fetchVodData();
  }

  _fetchVodData() {
    let thumbSubTypesFilter = '';
    if (this._types.has(KalturaCuePointType.SLIDE)) {
      thumbSubTypesFilter = `${KalturaThumbCuePointSubType.SLIDE},`;
    }

    // preparation for chapters
    // if (this._types.has(KalturaCuePoints.KalturaCuePointType.CHAPTER)) {
    //   subTypesFilter = `${subTypesFilter}${KalturaCuePoints.KalturaThumbCuePointSubType.CHAPTER},`;
    // }

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
    const createCuePointList = (thumbCuePoints: Array<KalturaThumbCuePoint>) => {
      return thumbCuePoints.map((thumbCuePoint: KalturaThumbCuePoint) => {
        return {
          assetUrl: makeAssetUrl(this._player.provider.env.serviceUrl, thumbCuePoint.assetId, this._player.config.session.ks),
          id: thumbCuePoint.id,
          cuePointType: thumbCuePoint.cuePointType,
          startTime: thumbCuePoint.startTime / 1000,
          endTime: Number.MAX_SAFE_INTEGER
        };
      });
    };
    const thumbCuePointsLoader: ThumbLoader = data.get(ThumbLoader.id);
    const thumbCuePoints: Array<KalturaThumbCuePoint> = thumbCuePointsLoader?.response.thumbCuePoints || [];
    this._logger.debug(`_fetchVodData thumb response successful with ${thumbCuePoints.length} cue points`);
    if (thumbCuePoints.length) {
      let cuePoints = createCuePointList(thumbCuePoints);
      cuePoints = sortArrayBy(cuePoints, 'startTime');
      cuePoints = this._fixCuePointsEndTime(cuePoints);
      this._addCuePointToPlayer(cuePoints);
    }
  }

  private _handleQuizQustionResponse(data: Map<string, any>) {
    const createCuePointList = (quizQuestionCuePoints: Array<KalturaQuizQuestionCuePoint>) => {
      return quizQuestionCuePoints.map((quizQuestionCuePoint: KalturaQuizQuestionCuePoint) => {
        const startTime = quizQuestionCuePoint.startTime / 1000;
        const quePointDuration = isSafari() ? 0.35 : 0.15;
        return {
          ...quizQuestionCuePoint,
          startTime,
          endTime: startTime + quePointDuration
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
}
