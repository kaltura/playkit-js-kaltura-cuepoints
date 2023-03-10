import {EventsManager, getQnaUserId} from '@playkit-js/common/dist/utils-common';
import {PrepareRegisterRequestConfig, PushNotifications} from './push-notifications';
import {CuepointTypeMap, KalturaCuePointType} from '../../types';

export interface PushNotificationData {
  cuePointType: string;
  entryId: string;
  id: string;
  objectType: string;
  partnerData: string;
  partnerId: number;
  startTime: number;
  status: number;
  tags: string;
  createdAt: number;
  updatedAt: number;
}

export interface ThumbPushNotificationData extends PushNotificationData {
  endTime?: number;
  assetId: string;
  subType: number;
}

export interface SlideViewChangePushNotificationData extends PushNotificationData {
  endTime?: number;
  duration: number;
  code: string;
}

export interface QnaPushNotificationData extends PushNotificationData {
  endTime?: number;
  relatedObjects: {
    QandA_ResponseProfile: {
      objectType: 'KalturaMetadataListResponse';
      totalCount: number;
      objects: Array<KalturaMetadata>;
    };
  };
  text: string;
}

export interface KalturaMetadata {
  createdAt: number;
  id: number;
  objectId: string;
  objectType: 'KalturaMetadata';
  xml: string;
}

export enum PushNotificationEventTypes {
  PushNotificationsError = 'PUSH_NOTIFICATIONS_ERROR',
  ThumbNotification = 'THUMB_CUE_POINT_READY_NOTIFICATION',
  SlideViewChangeNotification = 'SLIDE_VIEW_CHANGE_CODE_CUE_POINT',
  PublicNotifications = 'PUBLIC_QNA_NOTIFICATIONS',
  UserNotifications = 'USER_QNA_NOTIFICATIONS',
  CodeNotifications = 'CODE_QNA_NOTIFICATIONS'
}
export interface PublicNotificationsEvent {
  type: PushNotificationEventTypes.PublicNotifications;
  messages: QnaPushNotificationData[];
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
export interface UserQnaNotificationsEvent {
  type: PushNotificationEventTypes.UserNotifications;
  messages: QnaPushNotificationData[];
}
export interface SettingsNotificationsEvent {
  type: PushNotificationEventTypes.CodeNotifications;
  settings: QnaPushNotificationData[];
}
type Events =
  | ThumbNotificationsEvent
  | SlideViewChangeNotificationsEvent
  | PublicNotificationsEvent
  | NotificationsErrorEvent
  | UserQnaNotificationsEvent
  | SettingsNotificationsEvent;

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

    if (types.has(KalturaCuePointType.SLIDE)) {
      registrationConfigs.push(this._createThumbRegistration(entryId));
    }
    if (types.has(KalturaCuePointType.VIEW_CHANGE)) {
      registrationConfigs.push(this._createSlideViewChangeRegistration(entryId));
    }
    if (types.has(KalturaCuePointType.PUBLIC_QNA)) {
      registrationConfigs.push(this._createPublicQnaRegistration(entryId));
    }
    if (types.has(KalturaCuePointType.USER_QNA)) {
      const userId = getQnaUserId(this._player);
      registrationConfigs.push(this._createUserQnaRegistration(entryId, userId));
    }
    if (types.has(KalturaCuePointType.CODE_QNA)) {
      registrationConfigs.push(this._createCodeQnaRegistration(entryId));
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

  private _createPublicQnaRegistration(entryId: string): PrepareRegisterRequestConfig {
    this._logger.info('Register public qna notification');
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

  private _createUserQnaRegistration(entryId: string, userId: string): PrepareRegisterRequestConfig {
    this._logger.info('Register user qna notification');
    return {
      eventName: PushNotificationEventTypes.UserNotifications,
      eventParams: {
        entryId: entryId,
        userId: userId
      },
      onMessage: (response: any[]) => {
        this._events.emit({
          type: PushNotificationEventTypes.UserNotifications,
          messages: response
        });
      }
    };
  }

  private _createCodeQnaRegistration(entryId: string): PrepareRegisterRequestConfig {
    this._logger.info('Register code qna notification');
    return {
      eventName: PushNotificationEventTypes.CodeNotifications,
      eventParams: {
        entryId: entryId
      },
      onMessage: (response: any[]) => {
        this._events.emit({
          type: PushNotificationEventTypes.CodeNotifications,
          settings: response
        });
      }
    };
  }
}
