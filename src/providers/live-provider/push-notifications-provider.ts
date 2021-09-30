import {EventsManager} from './events-manager';
import {PrepareRegisterRequestConfig, PushNotifications} from './push-notifications';
import {CuepointTypeMap, CuepointType} from '../../types';

export interface PushNotificationData {
  cuePointType: string; // "codeCuePoint.Code", "thumbCuePoint.Thumb"
  entryId: string;
  id: string;
  objectType: string; // "KalturaCodeCuePoint", "KalturaThumbCuePoint"
  partnerData: string;
  partnerId: number;
  startTime: number;
  status: number; // 1
  tags: string; // "change-view-mode", "select-a-thumb"
  createdAt: number;
  updatedAt: number;
}

export interface ThumbPushNotificationData extends PushNotificationData {
  endTime?: number;
  assetId: string;
  subType: number;
}

export interface SlideViewChangePushNotificationData extends PushNotificationData {
  duration: number;
  code: string;
}

export enum PushNotificationEventTypes {
  PublicNotifications = 'PUBLIC_QNA_NOTIFICATIONS',
  PushNotificationsError = 'PUSH_NOTIFICATIONS_ERROR',
  ThumbNotification = 'THUMB_CUE_POINT_READY_NOTIFICATION',
  SlideViewChangeNotification = 'SLIDE_VIEW_CHANGE_CODE_CUE_POINT'
}
export interface PublicNotificationsEvent {
  type: PushNotificationEventTypes.PublicNotifications;
  messages: PushNotificationData[]; // TODO: add interface
}
export interface NotificationsErrorEvent {
  type: PushNotificationEventTypes.PushNotificationsError;
  error: string;
}
export interface ThumbNotificationsEvent {
  type: PushNotificationEventTypes.ThumbNotification;
  thumbs: ThumbPushNotificationData[];
}
export interface SlideViewChangeNotificationsEvent {
  type: PushNotificationEventTypes.SlideViewChangeNotification;
  slideViewChanges: SlideViewChangePushNotificationData[];
}
type Events = ThumbNotificationsEvent | SlideViewChangeNotificationsEvent | PublicNotificationsEvent | NotificationsErrorEvent;

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
      registrationConfigs.push(this._createSlideViewChangeRegistration(entryId));
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

  private _createSlideViewChangeRegistration(entryId: string): PrepareRegisterRequestConfig {
    this._logger.info('Register slide notification');
    return {
      eventName: PushNotificationEventTypes.SlideViewChangeNotification,
      eventParams: {
        entryId: entryId
      },
      onMessage: (response: any[]) => {
        this._events.emit({
          type: PushNotificationEventTypes.SlideViewChangeNotification,
          slideViewChanges: response
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
