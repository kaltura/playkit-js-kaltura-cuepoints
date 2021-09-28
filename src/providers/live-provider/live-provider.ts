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
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;

type CuePoints = Record<string, SlideViewChangePushNotificationData[] | ThumbPushNotificationData[]>;

export class LiveProvider extends Provider {
  _pushNotification: PushNotificationPrivider;
  _cuePoints: CuePoints = {};
  constructor(player: Player, logger: Logger, types: CuepointTypeMap) {
    super(player, logger, types);
    this._pushNotification = new PushNotificationPrivider(this._player, this._logger);
    this._initNotification();
    this._pushNotification.registerToPushServer(this._player.getMediaInfo().entryId, types, this._handleConnection, this._handleConnectionError);
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

  private _handleThumbNotificationData = ({thumbs}: ThumbNotificationsEvent) => {

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
  }
}
