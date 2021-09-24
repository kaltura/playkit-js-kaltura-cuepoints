import {Provider} from '../provider';
import {CuepointType, CuepointTypeMap} from '../../types';
import {PushNotificationPrivider, PushNotificationEventTypes} from './push-notifications-provider';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;

export class LiveProvider extends Provider {
  _pushNotification: PushNotificationPrivider;
  constructor(player: Player, logger: Logger, types: CuepointTypeMap) {
    super(player, logger, types);
    this._pushNotification = new PushNotificationPrivider(this._player, this._logger);
    this._initNotification();
    this._constructPushNotificationListener();
    this._pushNotification.registerToPushServer(
      this._player.getMediaInfo().entryId,
      types,
      () => {
        console.log('>> connected');
      },
      () => {
        console.log('>> connection error');
      }
    );
  }

  private _initNotification(): void {
    const ks = this._player.config.provider.ks;
    if (!ks) {
      this._logger.warn(
        'Warn: Failed to initialize.' +
          'Failed to retrieve ks from configuration ' +
          '(both providers and session objects returned with an undefined KS),' +
          ' please check your configuration file.'
      );
      return;
    }
    // should be created once on pluginSetup (entryId/userId registration will be called onMediaLoad)
    this._pushNotification.init();
  }

  // TODO: make separate data handler for each type
  private _handleData = (data: any) => {
    console.log('>> data', data);
  };

  private _constructPushNotificationListener(): void {
    if (this._types.has(CuepointType.SLIDE)) {
      this._pushNotification.on(PushNotificationEventTypes.SlideNotification, this._handleData);
      this._pushNotification.on(PushNotificationEventTypes.ThumbNotification, this._handleData);
    }
    if (this._types.has(CuepointType.AOA)) {
      this._pushNotification.on(PushNotificationEventTypes.PublicNotifications, this._handleData);
    }
  }

  private _removePushNotificationListener(): void {
    if (this._types.has(CuepointType.SLIDE)) {
      this._pushNotification.off(PushNotificationEventTypes.SlideNotification, this._handleData);
      this._pushNotification.off(PushNotificationEventTypes.ThumbNotification, this._handleData);
    }
    if (this._types.has(CuepointType.AOA)) {
      this._pushNotification.off(PushNotificationEventTypes.PublicNotifications, this._handleData);
    }
  }

  destroy() {
    this._pushNotification.reset();
    this._removePushNotificationListener();
  }
}
