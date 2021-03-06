import {Provider} from '../provider';
import {KalturaCuePointType, CuepointTypeMap} from '../../types';
import {
  PushNotificationPrivider,
  PushNotificationEventTypes,
  SlideViewChangeNotificationsEvent,
  ThumbNotificationsEvent,
  NotificationsErrorEvent,
  SlideViewChangePushNotificationData,
  ThumbPushNotificationData,
  PublicNotificationsEvent,
  QnAPushNotificationData
} from './push-notifications-provider';
import {makeAssetUrl, sortArrayBy} from '../utils';
import {ThumbUrlLoader} from '../common/thumb-url-loader';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

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

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._pushNotification = new PushNotificationPrivider(this._player, this._logger);
    this._currentTimeLivePromise = this._makeCurrentTimeLiveReadyPromise();
    this._thumbUrlLoaderPromise = this._makeThumbUrlLoaderResolvePromise();
    this._pushNotification.init();
    this._constructPushNotificationListener();
    this._pushNotification.registerToPushServer(this._player.sources.id, types, this._handleConnection, this._handleConnectionError);
    this._addBindings();
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
        const id3Timestamp = Math.ceil(JSON.parse(id3TagCues[id3TagCues.length - 1].value.data).timestamp / 1000);
        if (id3Timestamp) {
          this._id3Timestamp = id3Timestamp;
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
    this._eventManager.listen(this._player, this._player.Event.TIMED_METADATA, this._onTimedMetadataLoaded);
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

  private _makeCuePointStartEndTime = (cuePointCreatedAt: number, endTime = Number.MAX_SAFE_INTEGER) => {
    let startTime = this._player.currentTime - (this._currentTimeLive - cuePointCreatedAt);
    if (startTime < 0) {
      // TextTrack in Safari doesn't allow add new cue-points with startTime less then 0
      startTime = this._player.currentTime;
    }
    return {startTime, endTime};
  };

  private _prepareThumbCuePoints = (newThumb: ThumbPushNotificationData) => {
    const newThumbCue = {
      ...newThumb,
      ...this._makeCuePointStartEndTime(newThumb.createdAt),
      assetUrl: makeAssetUrl(this._baseThumbAssetUrl, newThumb.assetId)
    };
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
      this._slideViewChangeCuePoints.push(newViewChangeCue);
      this._slideViewChangeCuePoints = this._fixCuePointEndTime(this._slideViewChangeCuePoints);
      this._addCuePointToPlayer([newViewChangeCue]);
    } catch (e) {
      this._logger.error('Unnable parse slide-view change cue-point');
    }
  };

  private _preparePublicQnACuePoints = (message: QnAPushNotificationData) => {
    const qnaCuePoint = {
      ...message,
      ...this._makeCuePointStartEndTime(message.createdAt, message.endTime)
    };
    this._addCuePointToPlayer([qnaCuePoint]);
  };

  private _handleThumbNotificationData = ({thumbs}: ThumbNotificationsEvent) => {
    if (!this._baseThumbAssetUrl && !this._thumbUrlIsLoaderActive) {
      // Fetch and save baseThumbAssetUrl for thumbs
      this._thumbUrlIsLoaderActive = true;
      this._player.provider
        .doRequest([{loader: ThumbUrlLoader, params: {thumbAssetId: thumbs[0]?.assetId}}])
        .then((data: Map<string, any>) => {
          if (data.has(ThumbUrlLoader.id)) {
            const thumbAssetUrlLoader: ThumbUrlLoader = data.get(ThumbUrlLoader.id);
            this._baseThumbAssetUrl = thumbAssetUrlLoader?.response;
            this._thumbUrlLoaderResolvePromise();
          }
        })
        .catch((e: any) => {
          this._logger.warn("can't get baseThumbAssetUrl");
        })
        .finally(() => {
          this._thumbUrlIsLoaderActive = false;
        });
    }

    Promise.all([this._currentTimeLivePromise, this._thumbUrlLoaderPromise]).then(() => {
      thumbs.forEach(thumb => this._prepareThumbCuePoints(thumb));
    });
  };

  private _handleSlideViewChangeNotificationData = ({slideViewChanges}: SlideViewChangeNotificationsEvent) => {
    this._currentTimeLivePromise.then(() => {
      slideViewChanges.forEach(viewChange => this._prepareViewChangeCuePoints(viewChange));
    });
  };

  private _handlePublicNotificationsData = ({messages}: PublicNotificationsEvent) => {
    this._currentTimeLivePromise.then(() => {
      messages.forEach(message => this._preparePublicQnACuePoints(message));
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
    if (this._types.has(KalturaCuePointType.QNA)) {
      this._pushNotification.on(PushNotificationEventTypes.PublicNotifications, this._handlePublicNotificationsData);
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
    if (this._types.has(KalturaCuePointType.QNA)) {
      this._pushNotification.off(PushNotificationEventTypes.PublicNotifications, this._handlePublicNotificationsData);
    }
  }

  destroy() {
    this._pushNotification.reset();
    this._removePushNotificationListener();
    this._currentTimeLivePromise = this._makeCurrentTimeLiveReadyPromise();
    this._thumbUrlLoaderPromise = this._makeThumbUrlLoaderResolvePromise();
  }
}
