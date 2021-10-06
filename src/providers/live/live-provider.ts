import {Provider} from '../provider';
import {KalturaCuePointType, CuepointTypeMap} from '../../types';
import {
  PushNotificationPrivider,
  PushNotificationEventTypes,
  SlideViewChangeNotificationsEvent,
  ThumbNotificationsEvent,
  PublicNotificationsEvent,
  NotificationsErrorEvent,
  SlideViewChangePushNotificationData,
  ThumbPushNotificationData
} from './push-notifications-provider';
import {makeAssetUrl} from '../utils';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

const ID3_TAG_WAIT_TIMEOUT = 500;
const ID3_TAG_LABEL = 'id3';

export class LiveProvider extends Provider {
  private _pushNotification: PushNotificationPrivider;
  private _thumbCuePoints: ThumbPushNotificationData[] = [];
  private _slideViewChangeCuePoints: SlideViewChangePushNotificationData[] = [];

  private _id3Timestamp: number | null = 0;
  private _currentTime = 0;
  private _currentTimeLive = 0;
  private _seekDifference: number | null = 0;
  private _id3TagWaitTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._pushNotification = new PushNotificationPrivider(this._player, this._logger);
    this._initNotification();
    this._pushNotification.registerToPushServer(this._player.getMediaInfo().entryId, types, this._handleConnection, this._handleConnectionError);
    this._addBindings();
  }

  private _onTimedMetadataLoaded = ({payload}: any): void => {
    // TODO: handle dash format
    const id3TagCues = payload.label === ID3_TAG_LABEL ? payload.cues : [];
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

  private _initNotification(): void {
    this._pushNotification.init();
    this._constructPushNotificationListener();
  }

  private _prepareCuePoints<T extends ThumbPushNotificationData | SlideViewChangePushNotificationData>(cuePoint: T, cb: (cuePoint: T) => void) {
    if (!this._player.currentTime) {
      this._id3TagWaitTimeouts[cuePoint.id] = setTimeout(() => {
        // wait till id3 tag handled
        cb(cuePoint);
      }, ID3_TAG_WAIT_TIMEOUT);
      return;
    }
    delete this._id3TagWaitTimeouts[cuePoint.id];
    cb(cuePoint);
  }

  private _fixCuePointEndTime<T extends ThumbPushNotificationData | SlideViewChangePushNotificationData>(cuePoints: T[]) {
    return cuePoints
      .sort((a, b) => {
        return a.createdAt - b.createdAt;
      })
      .map((cue, index) => {
        // fix endTime and replace VTTCue
        if (cue.endTime === Number.MAX_SAFE_INTEGER && index !== cuePoints.length - 1) {
          const fixedCue = {...cue, endTime: cuePoints[index + 1].startTime};
          this._player.cuePointManager.addCuePoints([fixedCue]);
        }
        return cue;
      });
  }

  private _prepareThumbCuePoints = (newThumb: ThumbPushNotificationData) => {
    const startTime = this._player.currentTime - (this._currentTimeLive - newThumb.createdAt);
    const newThumbCue = {
      ...newThumb,
      startTime: Number(startTime.toFixed(2)),
      endTime: Number.MAX_SAFE_INTEGER,
      assetUrl: makeAssetUrl(this._serviceUrl, newThumb.assetId, this._ks)
    };
    this._thumbCuePoints.push(newThumbCue);
    this._thumbCuePoints = this._fixCuePointEndTime(this._thumbCuePoints);
    this._player.cuePointManager.addCuePoints([newThumbCue]);
  };

  private _prepareViewChangeCuePoints = (viewChange: SlideViewChangePushNotificationData) => {
    const startTime = this._player.currentTime - (this._currentTimeLive - viewChange.createdAt);
    try {
      const partnerData = JSON.parse(viewChange.partnerData);
      const newViewChangeCue = {
        ...viewChange,
        startTime: Number(startTime.toFixed(2)),
        endTime: Number.MAX_SAFE_INTEGER,
        partnerData
      };
      this._slideViewChangeCuePoints.push(newViewChangeCue);
      this._slideViewChangeCuePoints = this._fixCuePointEndTime(this._slideViewChangeCuePoints);
      this._player.cuePointManager.addCuePoints([newViewChangeCue]);
    } catch (e) {
      this._logger.error('Unnable parse slide-view change cue-point');
    }
  };

  private _handleThumbNotificationData = ({thumbs}: ThumbNotificationsEvent) => {
    thumbs.forEach(thumb => this._prepareCuePoints(thumb, this._prepareThumbCuePoints));
  };

  private _handleSlideViewChangeNotificationData = ({slideViewChanges}: SlideViewChangeNotificationsEvent) => {
    slideViewChanges.forEach(viewChange => this._prepareCuePoints(viewChange, this._prepareViewChangeCuePoints));
  };

  // Placeholder for AOA cue-points
  // private _handlePublicNotificationsData(data: PublicNotificationsEvent) {
  //   console.log('>> handlePublicNotificationsData', data);
  //   // TODO: prepare data and push to cue-point manager
  // }

  private _handlePushNotificationsErrorData(data: NotificationsErrorEvent) {
    this._logger.error('Got an error from push notification server');
  }

  private _constructPushNotificationListener(): void {
    this._pushNotification.on(PushNotificationEventTypes.PushNotificationsError, this._handlePushNotificationsErrorData);

    if (this._types.has(KalturaCuePointType.SLIDE)) {
      this._pushNotification.on(PushNotificationEventTypes.ThumbNotification, this._handleThumbNotificationData);
    }

    if (this._types.has(KalturaCuePointType.VIEW_CHANGE)) {
      this._pushNotification.on(PushNotificationEventTypes.SlideViewChangeNotification, this._handleSlideViewChangeNotificationData);
    }
    // Placeholder for AOA cue-points
    // if (this._types.has(KalturaCuePointType.AOA)) {
    //   this._pushNotification.on(PushNotificationEventTypes.PublicNotifications, this._handlePublicNotificationsData);
    // }
  }

  private _removePushNotificationListener(): void {
    this._pushNotification.off(PushNotificationEventTypes.PushNotificationsError, this._handlePushNotificationsErrorData);

    if (this._types.has(KalturaCuePointType.SLIDE)) {
      this._pushNotification.off(PushNotificationEventTypes.ThumbNotification, this._handleThumbNotificationData);
    }
    if (this._types.has(KalturaCuePointType.VIEW_CHANGE)) {
      this._pushNotification.off(PushNotificationEventTypes.SlideViewChangeNotification, this._handleSlideViewChangeNotificationData);
    }
    // Placeholder for AOA cue-points
    // if (this._types.has(KalturaCuePointType.AOA)) {
    //   this._pushNotification.off(PushNotificationEventTypes.PublicNotifications, this._handlePublicNotificationsData);
    // }
  }

  destroy() {
    this._pushNotification.reset();
    this._removePushNotificationListener();
    for (const timeout in this._id3TagWaitTimeouts) {
      clearTimeout(this._id3TagWaitTimeouts[timeout]);
    }
  }
}
