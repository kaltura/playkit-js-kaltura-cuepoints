import {EventsManager} from './events-manager';
import {PrepareRegisterRequestConfig, PushNotifications, PushNotificationsOptions} from './push-notifications';
import {CuepointTypeMap, CuepointType} from '../../types';

export enum PushNotificationEventTypes {
  PublicNotifications = 'PUBLIC_QNA_NOTIFICATIONS',
  PushNotificationsError = 'PUSH_NOTIFICATIONS_ERROR',
  ThumbNotification = 'THUMB_CUE_POINT_READY_NOTIFICATION',
  SlideNotification = 'SLIDE_VIEW_CHANGE_CODE_CUE_POINT'
}
export interface PublicNotificationsEvent {
  type: PushNotificationEventTypes.PublicNotifications;
  messages: any[];
}
export interface NotificationsErrorEvent {
  type: PushNotificationEventTypes.PushNotificationsError;
  error: string;
}
export interface ThumbNotificationsEvent {
  type: PushNotificationEventTypes.ThumbNotification;
  thumbs: any[];
}
export interface SlideNotificationsEvent {
  type: PushNotificationEventTypes.SlideNotification;
  slides: any[];
}
type Events = ThumbNotificationsEvent | SlideNotificationsEvent | PublicNotificationsEvent | NotificationsErrorEvent;

/**
 * handles push notification registration and results.
 */
export class PushNotificationPrivider {
  private _pushServerInstance: PushNotifications | null = null;
  private _registeredToMessages = false;
  private _events: EventsManager<Events> = new EventsManager<Events>();
  private _initialized = false;

  on: EventsManager<Events>['on'] = this._events.on.bind(this._events);
  off: EventsManager<Events>['off'] = this._events.off.bind(this._events);

  constructor(private _player: KalturaPlayerTypes.Player, private _logger: KalturaPlayerTypes.Logger) {}

  public init() {
    if (this._initialized) return;
    this._initialized = true;
    this._pushServerInstance = new PushNotifications(this._player, this._logger);
  }

  /**
   * should be called on mediaUnload
   */
  public reset() {
    this._registeredToMessages = false;
  }

  public registerToPushServer(entryId: string, types: CuepointTypeMap, onSuccess: () => void, onError: () => void) {
    if (this._registeredToMessages) {
      this._logger.error('Multiple registration error');
      throw new Error('Already register to push server');
    }
    this._logger.info('Registering for push notifications server');
    if (!this._pushServerInstance) {
      this._logger.error("Can't register to notifications as _pushServerInstance doesn't exists");
      this._events.emit({
        type: PushNotificationEventTypes.PushNotificationsError,
        error: "Can't register to notifications as _pushServerInstance doesn't exists"
      });
      return;
    }

    // notification objects
    const registrationConfigs = [];

    if (types.has(CuepointType.SLIDE)) {
      registrationConfigs.push(this._createThumbRegistration(entryId));
      registrationConfigs.push(this._createSlideRegistration(entryId));
    }

    if (types.has(CuepointType.AOA)) {
      registrationConfigs.push(this._createPublicRegistration(entryId));
    }

    this._pushServerInstance
      .registerNotifications({
        prepareRegisterRequestConfigs: registrationConfigs,
        onSocketReconnect: () => {}
      })
      .then(
        () => {
          this._logger.info('Registered push notification service');
          this._registeredToMessages = true;
          onSuccess();
        },
        (err: any) => {
          this._logger.error('Registration for push notification error');
          onError();
          this._events.emit({
            type: PushNotificationEventTypes.PushNotificationsError,
            error: err
          });
        }
      );
  }

  private _createThumbRegistration(entryId: string): PrepareRegisterRequestConfig {
    this._logger.info('Register thumb notification');
    return {
      eventName: PushNotificationEventTypes.ThumbNotification,
      eventParams: {
        entryId: entryId
      },
      onMessage: (response: any[]) => {
        this._events.emit({
          type: PushNotificationEventTypes.ThumbNotification,
          thumbs: response
        });
      }
    };
  }

  private _createSlideRegistration(entryId: string): PrepareRegisterRequestConfig {
    this._logger.info('Register slide notification');
    return {
      eventName: PushNotificationEventTypes.SlideNotification,
      eventParams: {
        entryId: entryId
      },
      onMessage: (response: any[]) => {
        this._events.emit({
          type: PushNotificationEventTypes.SlideNotification,
          slides: response // TODO: prepare slides
        });
      }
    };
  }

  private _createPublicRegistration(entryId: string): PrepareRegisterRequestConfig {
    this._logger.info('Register public notification');
    return {
      eventName: PushNotificationEventTypes.PublicNotifications,
      eventParams: {
        entryId: entryId
      },
      onMessage: (response: any[]) => {
        this._events.emit({
          type: PushNotificationEventTypes.PublicNotifications,
          messages: response
        });
      }
    };
  }
}
