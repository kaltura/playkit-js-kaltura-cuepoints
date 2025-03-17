import {Provider, ProviderRequest} from '../provider';
import {KalturaCuePointType, CuepointTypeMap, KalturaThumbCuePointSubType} from '../../types';
import {
  PushNotificationPrivider,
  PushNotificationEventTypes,
  SlideViewChangeNotificationsEvent,
  ThumbNotificationsEvent,
  NotificationsErrorEvent,
  SlideViewChangePushNotificationData,
  ThumbPushNotificationData,
  PublicNotificationsEvent,
  UserQnaNotificationsEvent,
  QnaPushNotificationData,
  SettingsNotificationsEvent
} from './push-notifications-provider';
import {makeAssetUrl, sortArrayBy} from '../utils';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import {ThumbUrlLoader, ThumbLoader, HotspotLoader} from '../common';

export class LiveProvider extends Provider {
  private _pushNotification: PushNotificationPrivider;
  private _thumbCuePoints: ThumbPushNotificationData[] = [];
  private _slideViewChangeCuePoints: SlideViewChangePushNotificationData[] = [];

  private _id3Timestamp: number | null = 0;
  private _currentTime = 0;
  private _currentTimeLive = 0;
  private _seekDifference: number | null = 0;
  private _currentTimeLiveResolvePromise = () => {};
  private _currentTimeLivePromise: Promise<void>;

  private _baseThumbAssetUrl: string = '';
  private _thumbUrlLoaderResolvePromise = () => {};
  private _thumbUrlLoaderPromise: Promise<void>;
  private _thumbUrlIsLoaderActive = false;
  private _thumbUrlAssetIdQueue: Array<string> = [];

  private _simuliveEntryIds: Set<string>;

  private _simuliveStartTime = -1;

  private _currentClipEntryId?: string;

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._pushNotification = new PushNotificationPrivider(this._player, this._logger);
    this._currentTimeLivePromise = this._makeCurrentTimeLiveReadyPromise();
    this._thumbUrlLoaderPromise = this._makeThumbUrlLoaderResolvePromise();
    this._pushNotification.init();
    this._constructPushNotificationListener();
    this._pushNotification.registerToPushServer(this._player.sources.id, types, this._handleConnection, this._handleConnectionError);
    this._addBindings();
    this._simuliveEntryIds = new Set();

    this._eventManager.listen(this._player, this._player.Event.PLAYING, () => {
      if (this._simuliveStartTime === -1) {
        this._simuliveStartTime = Date.now() - this._player.currentTime;
      }
    });
    this._eventManager.listen(this._player, this._player.Event.RESET, () => {
      this._simuliveStartTime = -1;
    });
  }

  private _makeCurrentTimeLiveReadyPromise = () => {
    return new Promise<void>(res => {
      this._currentTimeLiveResolvePromise = res;
    });
  };

  private _makeThumbUrlLoaderResolvePromise = () => {
    return new Promise<void>(res => {
      this._thumbUrlLoaderResolvePromise = res;
    });
  };

  private _onTimedMetadataLoaded = ({payload}: any): void => {
    // TODO: handle dash format
    const id3TagCues = payload.cues.filter((cue: any) => cue.value && cue.value.key === 'TEXT');
    if (id3TagCues.length) {
      try {
        const lastCue = id3TagCues[id3TagCues.length - 1];
        const id3Data = JSON.parse(lastCue.value.data);
        const {timestamp, clipId, setId} = id3Data;

        const id3Timestamp = Math.ceil(timestamp / 1000);
        if (id3Timestamp) {
          this._id3Timestamp = id3Timestamp;
        }

        if (!id3Data.clipId || !id3Data.setId) {
          return;
        }

        const [partType, originalEntryId, clipStartTimestamp] = id3Data.clipId.split('-');
        const cuepointOffset = this._getSimuliveCuepointOffset(id3Data.setId, id3Data.clipId);
        if (cuepointOffset === null) {
          return;
        }

        const currentClipStartTime = this._player.currentTime + cuepointOffset;

        const textTracks = [...(this._player.getVideoElement().textTracks as any)];
        const cuepointsTrack = textTracks.find(t => t.label === 'CuePoints');
        const activeCues = cuepointsTrack?.activeCues || [];

        if (originalEntryId !== this._currentClipEntryId) {
          this._currentClipEntryId = originalEntryId;

          for (const cue of activeCues) {
            cue.endTime = currentClipStartTime;
          }

          if (!this._simuliveEntryIds.has(originalEntryId)) {
            this._simuliveEntryIds.add(originalEntryId);
            this._addSimuliveCuepoints(originalEntryId, currentClipStartTime);
          }
        }
      } catch (e) {
        this._logger.debug('Failed retrieving id3 tag metadata');
      }
    }
  };

  private _onTimeUpdate = (): void => {
    // TODO: handle dash format
    const newTime = Math.ceil(this._player.currentTime);
    if (newTime === this._currentTime) {
      return;
    }
    this._currentTime = newTime;
    if (this._seekDifference !== null && this._currentTimeLive) {
      // update _currentTimeLive after seek
      this._currentTimeLive = this._currentTimeLive - this._seekDifference;
    } else if (this._id3Timestamp) {
      if (this._id3Timestamp === this._currentTimeLive) {
        // prevent updating if calculated _currentTimeLive value the same as _id3Timestamp
        this._id3Timestamp = null;
        return;
      }
      // update _currentTimeLive from id3Tag time
      this._currentTimeLive = this._id3Timestamp;
    } else {
      // update _currentTimeLive between id3Tags
      this._currentTimeLive++;
    }
    if (this._id3Timestamp) {
      this._currentTimeLiveResolvePromise();
    }

    this._id3Timestamp = null;
    this._seekDifference = null;
  };

  private _handleSeeking = (): void => {
    this._seekDifference = Math.ceil(this._currentTime - this._player.currentTime);
  };

  private _addBindings() {
    this._eventManager.listen(this._player, this._player.Event.TIMED_METADATA, e => this._onTimedMetadataLoaded(e));
    this._eventManager.listen(this._player, this._player.Event.SEEKING, this._handleSeeking);
    this._eventManager.listen(this._player, this._player.Event.TIME_UPDATE, this._onTimeUpdate);
  }

  private _handleConnection = () => {
    this._logger.debug('Connected to push server');
  };

  private _handleConnectionError = () => {
    this._logger.error('Got an error during connection to push server');
  };

  private _fixCuePointEndTime<T extends ThumbPushNotificationData | SlideViewChangePushNotificationData>(cuePoints: T[]) {
    return sortArrayBy(cuePoints, 'createdAt').map((cue, index) => {
      // fix endTime and replace VTTCue
      if (cue.endTime === Number.MAX_SAFE_INTEGER && index !== cuePoints.length - 1) {
        const fixedCue = {...cue, endTime: cuePoints[index + 1].startTime};
        this._addCuePointToPlayer([fixedCue]);
        return fixedCue;
      }
      return cue;
    });
  }

  private _makeCuePointStartEndTime = (cuePointCreatedAt: number, cuePointEndTime?: number) => {
    let startTime = this._player.currentTime - (this._currentTimeLive - cuePointCreatedAt);
    const endTime = cuePointEndTime ? this._player.currentTime - (this._currentTimeLive - cuePointEndTime) : Number.MAX_SAFE_INTEGER;
    if (!this._player.isDvr()) {
      const isCuePointBehindLiveEdge = this._currentTimeLive - cuePointCreatedAt > 0;
      if (isCuePointBehindLiveEdge) {
        startTime = this._player.currentTime;
      }
    }
    return {startTime, endTime};
  };

  private _isCueInvalid = (cue: {startTime: number}) => {
    // cue points from previous session or out of DVR window
    return isNaN(cue.startTime) || cue.startTime < 0;
  };

  private _prepareThumbCuePoints = (newThumb: ThumbPushNotificationData) => {
    const newThumbCue = {
      ...newThumb,
      ...this._makeCuePointStartEndTime(newThumb.createdAt),
      assetUrl: makeAssetUrl(this._baseThumbAssetUrl, newThumb.assetId)
    };
    if (this._isCueInvalid(newThumbCue)) {
      return;
    }
    this._thumbCuePoints.push(newThumbCue);
    this._thumbCuePoints = this._fixCuePointEndTime(this._thumbCuePoints);
    this._addCuePointToPlayer([newThumbCue]);
  };

  private _prepareViewChangeCuePoints = (viewChange: SlideViewChangePushNotificationData) => {
    try {
      const partnerData = JSON.parse(viewChange.partnerData);
      const newViewChangeCue = {
        ...viewChange,
        ...this._makeCuePointStartEndTime(viewChange.createdAt),
        partnerData
      };
      if (this._isCueInvalid(newViewChangeCue)) {
        return;
      }
      this._slideViewChangeCuePoints.push(newViewChangeCue);
      this._slideViewChangeCuePoints = this._fixCuePointEndTime(this._slideViewChangeCuePoints);
      this._addCuePointToPlayer([newViewChangeCue]);
    } catch (e) {
      this._logger.error('Unnable parse slide-view change cue-point');
    }
  };

  private _preparePublicQnaCuePoints = (message: QnaPushNotificationData) => {
    const qnaCuePoint = {
      ...message,
      cueType: KalturaCuePointType.PUBLIC_QNA,
      ...this._makeCuePointStartEndTime(message.createdAt, message.endTime)
    };
    if (this._isCueInvalid(qnaCuePoint)) {
      return;
    }
    this._addCuePointToPlayer([qnaCuePoint]);
  };

  private _prepareUserQnaCuePoints = (message: QnaPushNotificationData) => {
    const userQnaCuePoint = {
      ...message,
      cueType: KalturaCuePointType.USER_QNA,
      startTime: 0,
      endTime: 0
    };
    this._addCuePointToPlayer([userQnaCuePoint], {useDataAggregator: false});
  };

  private _prepareCodeQnaCuePoints = (setting: QnaPushNotificationData) => {
    try {
      const partnerData = JSON.parse(setting.partnerData);
      const newCodeCue = {
        ...setting,
        partnerData
      };
      this._addCuePointToPlayer([newCodeCue]);
    } catch (e) {
      this._logger.error('Unnable parse code qna cue-point');
    }
  };

  private _getBaseThumbAssetUrl = (): void => {
    if (this._thumbUrlIsLoaderActive) {
      return;
    }
    this._thumbUrlIsLoaderActive = true;
    // get thumbAssetId from queue
    const thumbAssetId = this._thumbUrlAssetIdQueue.shift();
    // Try fetch and then save baseThumbAssetUrl for thumbs
    this._player.provider
      .doRequest([{loader: ThumbUrlLoader, params: {thumbAssetId}}])
      .then((data: Map<string, any>) => {
        this._thumbUrlIsLoaderActive = false;
        if (data.has(ThumbUrlLoader.id)) {
          this._logger.debug('baseThumbAssetUrl fetched');
          const thumbAssetUrlLoader: ThumbUrlLoader = data.get(ThumbUrlLoader.id);
          this._baseThumbAssetUrl = thumbAssetUrlLoader?.response;
          // clear thumbUrlAssetId queue
          this._thumbUrlAssetIdQueue = [];
          this._thumbUrlLoaderResolvePromise();
        }
      })
      .catch((e: any) => {
        this._thumbUrlIsLoaderActive = false;
        this._logger.warn("can't get baseThumbAssetUrl");
        if (this._thumbUrlAssetIdQueue.length) {
          this._logger.debug('try get next thumbAssetId from queue');
          this._getBaseThumbAssetUrl();
        }
      });
  };

  private _handleThumbNotificationData = ({thumbs}: ThumbNotificationsEvent) => {
    if (!this._baseThumbAssetUrl && thumbs[0]?.assetId) {
      // Add thumbAssetId to queue
      this._thumbUrlAssetIdQueue.push(thumbs[0]?.assetId);
      this._getBaseThumbAssetUrl();
    }
    // Wait till baseThumbAssetUrl got ready
    Promise.all([this._currentTimeLivePromise, this._thumbUrlLoaderPromise]).then(() => {
      thumbs.forEach(thumb => this._prepareThumbCuePoints(thumb));
    });
  };

  private _handleSlideViewChangeNotificationData = ({slideViewChanges}: SlideViewChangeNotificationsEvent) => {
    this._currentTimeLivePromise.then(() => {
      slideViewChanges.forEach(viewChange => this._prepareViewChangeCuePoints(viewChange));
    });
  };

  private _handlePublicQnaNotificationsData = ({messages}: PublicNotificationsEvent) => {
    this._currentTimeLivePromise.then(() => {
      messages.forEach(message => this._preparePublicQnaCuePoints(message));
    });
  };

  private _handleUserQnaNotificationsData = ({messages}: UserQnaNotificationsEvent) => {
    this._currentTimeLivePromise.then(() => {
      messages.forEach(message => this._prepareUserQnaCuePoints(message));
    });
  };

  private _handleCodeQnaNotificationsData = ({settings}: SettingsNotificationsEvent) => {
    this._currentTimeLivePromise.then(() => {
      settings.forEach(setting => this._prepareCodeQnaCuePoints(setting));
    });
  };

  private _handlePushNotificationsErrorData(data: NotificationsErrorEvent) {
    this._logger.warn('Got an error from push notification server - ', data);
  }

  private _constructPushNotificationListener(): void {
    this._pushNotification.on(PushNotificationEventTypes.PushNotificationsError, this._handlePushNotificationsErrorData);

    if (this._types.has(KalturaCuePointType.SLIDE)) {
      this._pushNotification.on(PushNotificationEventTypes.ThumbNotification, this._handleThumbNotificationData);
    }
    if (this._types.has(KalturaCuePointType.VIEW_CHANGE)) {
      this._pushNotification.on(PushNotificationEventTypes.SlideViewChangeNotification, this._handleSlideViewChangeNotificationData);
    }
    if (this._types.has(KalturaCuePointType.PUBLIC_QNA)) {
      this._pushNotification.on(PushNotificationEventTypes.PublicNotifications, this._handlePublicQnaNotificationsData);
    }
    if (this._types.has(KalturaCuePointType.USER_QNA)) {
      this._pushNotification.on(PushNotificationEventTypes.UserNotifications, this._handleUserQnaNotificationsData);
    }
    if (this._types.has(KalturaCuePointType.CODE_QNA)) {
      this._pushNotification.on(PushNotificationEventTypes.CodeNotifications, this._handleCodeQnaNotificationsData);
    }
  }

  private _removePushNotificationListener(): void {
    this._pushNotification.off(PushNotificationEventTypes.PushNotificationsError, this._handlePushNotificationsErrorData);

    if (this._types.has(KalturaCuePointType.SLIDE)) {
      this._pushNotification.off(PushNotificationEventTypes.ThumbNotification, this._handleThumbNotificationData);
    }
    if (this._types.has(KalturaCuePointType.VIEW_CHANGE)) {
      this._pushNotification.off(PushNotificationEventTypes.SlideViewChangeNotification, this._handleSlideViewChangeNotificationData);
    }
    if (this._types.has(KalturaCuePointType.PUBLIC_QNA)) {
      this._pushNotification.off(PushNotificationEventTypes.PublicNotifications, this._handlePublicQnaNotificationsData);
    }
    if (this._types.has(KalturaCuePointType.USER_QNA)) {
      this._pushNotification.off(PushNotificationEventTypes.UserNotifications, this._handleUserQnaNotificationsData);
    }
    if (this._types.has(KalturaCuePointType.CODE_QNA)) {
      this._pushNotification.off(PushNotificationEventTypes.CodeNotifications, this._handleCodeQnaNotificationsData);
    }
  }

  private _getSimuliveCuepointOffset(setId: string, clipId: string): number | null {
    const [_, __, clipStartTimestamp] = clipId.split('-');
    if (!clipStartTimestamp || this._simuliveStartTime === -1) return null;
    return (Number(clipStartTimestamp) - this._simuliveStartTime) / 1000;
  }

  private _addSimuliveCuepoints(originalEntryId: string, cuepointOffset: number) {
    let requests: Array<ProviderRequest> = [];

    let thumbSubTypesFilter = '';
    if (this._types.has(KalturaCuePointType.SLIDE)) {
      thumbSubTypesFilter = `${KalturaThumbCuePointSubType.SLIDE},`;
    }
    if (thumbSubTypesFilter) {
      requests.push({loader: ThumbLoader, params: {entryId: originalEntryId, subTypesFilter: thumbSubTypesFilter}});
    }

    if (this._types.has(KalturaCuePointType.HOTSPOT)) {
      requests.push({loader: HotspotLoader, params: {entryId: originalEntryId}});
    }

    if (!requests.length) {
      return;
    }

    this._player.provider.doRequest(requests).then((data: Map<string, any>) => {
      if (!data) {
        this._logger.warn("Simulive cue points doRequest doesn't have data");
        return;
      }
      if (data.has(ThumbLoader.id)) {
        this._handleThumbResponse(data, {cuepointOffset, useDataAggregator: false, usePendingQueManager: true});
      }
      if (data.has(HotspotLoader.id)) {
        this._handleHotspotResponse(data, {cuepointOffset, useDataAggregator: false, usePendingQueManager: true});
      }
    });
  }

  destroy() {
    this._pushNotification.reset();
    this._removePushNotificationListener();
    this._currentTimeLivePromise = this._makeCurrentTimeLiveReadyPromise();
    this._thumbUrlLoaderPromise = this._makeThumbUrlLoaderResolvePromise();
  }
}
