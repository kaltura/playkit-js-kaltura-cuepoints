import {APIResponse, ClientApi, isAPIErrorResponse, RegisterRequestResponse} from './client-api';
import {RegisterRequestParams} from './push-notification-loader';
import {SocketWrapper} from './socket-wrapper';
import {getDomainFromUrl} from './utils';

export interface EventParams extends Record<string, any> {
  entryId: string;
  userId?: string;
}

export interface PrepareRegisterRequestConfig {
  eventName: string;
  eventParams?: EventParams;
  onMessage: Function;
}

export interface RegisterNotificationsParams {
  prepareRegisterRequestConfigs: PrepareRegisterRequestConfig[];
  onSocketDisconnect?: Function;
  onSocketReconnect?: Function;
}

export interface APINotificationResponse extends APIResponse {
  url: string;
  queueName: string;
  queueKey: string;
}

export function isAPINotificationResponse(response: APIResponse): response is APINotificationResponse {
  return response.objectType === 'KalturaPushNotificationData';
}

export class PushNotifications {
  private _socketPool: any = {};
  private _clientApi: any;

  constructor(private _player: KalturaPlayerTypes.Player, private _logger: KalturaPlayerTypes.Logger) {
    this._clientApi = new ClientApi(_player, _logger);
    this._onPlayerReset();
  }

  private _onPlayerReset() {
    this._player.addEventListener(this._player.Event.PLAYER_RESET, () => {
      this.reset();
    });
  }

  public reset() {
    for (const socketKey in this._socketPool) {
      this._socketPool[socketKey].destroy();
    }
    this._socketPool = {};
  }

  public registerNotifications(registerNotifications: RegisterNotificationsParams): Promise<void> {
    const apiRequests: RegisterRequestParams[] = registerNotifications.prepareRegisterRequestConfigs.map(
      (eventConfig: PrepareRegisterRequestConfig) => {
        return this._prepareRegisterRequest(eventConfig);
      }
    );

    return this._clientApi.doMultiRegisterRequest(apiRequests).then((results: RegisterRequestResponse[]) => {
      const promiseArray = results.map((result, index) => {
        return this._processResult(
          registerNotifications.prepareRegisterRequestConfigs[index],
          result,
          registerNotifications.onSocketDisconnect,
          registerNotifications.onSocketReconnect
        );
      });

      return Promise.all(promiseArray).then(() => {
        return;
      });
    });
  }

  private _prepareRegisterRequest(prepareRegisterRequestConfig: PrepareRegisterRequestConfig): RegisterRequestParams {
    const request: RegisterRequestParams = {
      service: 'eventnotification_eventnotificationtemplate',
      action: 'register',
      notificationTemplateSystemName: prepareRegisterRequestConfig.eventName,
      pushNotificationParams: {
        objectType: 'KalturaPushNotificationParams',
        userParams: {}
      }
    };

    let index = 0;
    for (const paramsKey in prepareRegisterRequestConfig.eventParams) {
      request.pushNotificationParams.userParams[`item${index}`] = {
        objectType: 'KalturaPushNotificationParams',
        key: paramsKey,
        value: {
          objectType: 'KalturaStringValue',
          value: prepareRegisterRequestConfig.eventParams[paramsKey]
        },
        sQueueKeyParam: 1
      };
      index++;
    }

    return request;
  }

  private _processResult(
    registerRequest: PrepareRegisterRequestConfig,
    result: RegisterRequestResponse,
    onSocketDisconnect?: Function,
    onSocketReconnect?: Function
  ): Promise<void> {
    if (isAPIErrorResponse(result)) {
      this._logger.error(`Error fetching registration info from service ${registerRequest.eventName}`);
      return Promise.reject(new Error(result.message));
    }

    if (!isAPINotificationResponse(result)) {
      return Promise.reject(new Error('invalid response structure'));
    }

    //cache sockets by host name
    const socketKey = getDomainFromUrl(result.url);
    let socketWrapper = this._socketPool[socketKey];
    if (!socketWrapper) {
      socketWrapper = new SocketWrapper(
        {
          key: socketKey,
          url: result.url,
          onSocketDisconnect,
          onSocketReconnect
        },
        this._logger
      );
      this._socketPool[socketKey] = socketWrapper;
    }

    socketWrapper.prepareForListening(registerRequest.eventName, result.queueName, result.queueKey, registerRequest.onMessage);

    return Promise.resolve();
  }
}
