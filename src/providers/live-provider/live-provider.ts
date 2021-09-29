import {Provider} from '../provider';
import {CuepointType, CuepointTypeMap} from '../../types';
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
import {makeAssetUrl} from './utils';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;

const ID3_TAG_WAIT_TIMEOUT = 500;

export class LiveProvider extends Provider {
  private _pushNotification: PushNotificationPrivider;
  private _thumbCuePoints: ThumbPushNotificationData[] = [];
  // private _slideViewChangeCuePoints: SlideViewChangePushNotificationData[] = [];

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

  private _onTimedMetadataLoaded = (event: any): void => {
    // TODO: handle dash format

    // TODO: condiser take id3 timestamp from text-track (add new API to cue-point manager)
    // advantage: we can avoid 2 listeners and make run-time calculation of start-time for new cue-points from active id3 VTTCue
    // disadvantage: id3timestamp comes once per 4 sec, so we'll get those difference in start\end time for cue-points
    const id3TagCues = event.payload.cues.filter((cue: any) => cue.value && cue.value.key === 'TEXT');
    if (id3TagCues.length) {
      try {
        const id3Timestamp = Math.ceil(JSON.parse(id3TagCues[id3TagCues.length - 1].value.data).timestamp / 1000);
        this._logger.debug(`Calling cuepoint engine updateTime with id3 timestamp: ${id3Timestamp}`);
        if (id3Timestamp) {
          this._id3Timestamp = id3Timestamp;
        }
      } catch (e) {
        this._logger.debug('failed retrieving id3 tag metadata');
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

  private _handleSlideViewChangeNotificationData({slideViewChanges}: SlideViewChangeNotificationsEvent) {
    console.log('>> _handleSlideViewChangeNotificationData', slideViewChanges);
    // TODO: parse partnerData and add cue-point in cue-point manager
  }

  private _prepareThumbCuePoints = (newThumb: ThumbPushNotificationData) => {
    if (!this._player.currentTime) {
      this._id3TagWaitTimeouts[newThumb.id] = setTimeout(() => {
        // wait till id3 tag handled
        this._prepareThumbCuePoints(newThumb);
      }, ID3_TAG_WAIT_TIMEOUT);
      return;
    }
    delete this._id3TagWaitTimeouts[newThumb.id];

    const startTime = this._player.currentTime - (this._currentTimeLive - newThumb.createdAt);
    const ks = this._player.config.provider.ks;
    const serviceUrl = this._player.config.provider.env.serviceUrl;
    const newThumbCue = {
      ...newThumb,
      startTime: Number(startTime.toFixed(2)),
      endTime: Number.MAX_SAFE_INTEGER,
      assetUrl: makeAssetUrl(serviceUrl, newThumb.assetId, ks)
    };
    this._thumbCuePoints.push(newThumbCue);
    this._thumbCuePoints = this._thumbCuePoints
      .sort((a, b) => {
        return a.createdAt - b.createdAt;
      })
      .map((cue, index) => {
        // fix endTime and replace VTTCue
        if (cue.endTime === Number.MAX_SAFE_INTEGER && index !== this._thumbCuePoints.length - 1) {
          const fixedCue = {...cue, endTime: this._thumbCuePoints[index + 1].startTime};
          this._player.cuePointManager.addCuePoints([fixedCue]);
        }
        return cue;
      });
    this._player.cuePointManager.addCuePoints([newThumbCue]);
  };

  private _handleThumbNotificationData = ({thumbs}: ThumbNotificationsEvent) => {
    thumbs.forEach(thumb => this._prepareThumbCuePoints(thumb));
  };

  private _handlePublicNotificationsData(data: PublicNotificationsEvent) {
    console.log('>> handlePublicNotificationsData', data);
    // TODO: prepare data and push to cue-point manager
  }

  private _handlePushNotificationsErrorData(data: NotificationsErrorEvent) {
    this._logger.error('Got an error from push notification server');
  }

  private _constructPushNotificationListener(): void {
    this._pushNotification.on(PushNotificationEventTypes.PushNotificationsError, this._handlePushNotificationsErrorData);

    if (this._types.has(CuepointType.SLIDE)) {
      this._pushNotification.on(PushNotificationEventTypes.SlideNotification, this._handleSlideViewChangeNotificationData);
      this._pushNotification.on(PushNotificationEventTypes.ThumbNotification, this._handleThumbNotificationData);
    }
    if (this._types.has(CuepointType.AOA)) {
      this._pushNotification.on(PushNotificationEventTypes.PublicNotifications, this._handlePublicNotificationsData);
    }
  }

  private _removePushNotificationListener(): void {
    this._pushNotification.off(PushNotificationEventTypes.PushNotificationsError, this._handlePushNotificationsErrorData);

    if (this._types.has(CuepointType.SLIDE)) {
      this._pushNotification.off(PushNotificationEventTypes.SlideNotification, this._handleSlideViewChangeNotificationData);
      this._pushNotification.off(PushNotificationEventTypes.ThumbNotification, this._handleThumbNotificationData);
    }
    if (this._types.has(CuepointType.AOA)) {
      this._pushNotification.off(PushNotificationEventTypes.PublicNotifications, this._handlePublicNotificationsData);
    }
  }

  destroy() {
    this._pushNotification.reset();
    this._removePushNotificationListener();
    for (const timeout in this._id3TagWaitTimeouts) {
      clearTimeout(this._id3TagWaitTimeouts[timeout]);
    }
  }
}
