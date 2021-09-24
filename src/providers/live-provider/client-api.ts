import {RegisterRequestParams, PushNotificationLoader} from './push-notification-loader';

export interface APIResponse {
  objectType: string;
}

export interface RegisterRequestResponse extends APIResponse {
  queueKey: string;
  queueName: string;
  url: string;
}

export interface APIErrorResponse extends RegisterRequestResponse {
  objectType: string;
  code: string;
  message: string;
}

export interface ClientApiOptions {
  ks: string;
  serviceUrl: string;
  clientTag: string;
}

export function isAPIErrorResponse(response: RegisterRequestResponse): response is APIErrorResponse {
  return response.objectType === 'KalturaAPIException';
}

export class ClientApi {
  constructor(private _player: KalturaPlayerTypes.Player, private _logger: KalturaPlayerTypes.Logger) {
  }

  public doMultiRegisterRequest(apiRequests: RegisterRequestParams[]): Promise<void | RegisterRequestResponse[]> {
    return this._player.provider
      .doRequest([{loader: PushNotificationLoader, params: apiRequests}])
      .then((data: Map<string, any>) => {
        if (data && data.has(PushNotificationLoader.id)) {
          const pushNotificationLoader = data.get(PushNotificationLoader.id);
          return pushNotificationLoader?.response as RegisterRequestResponse[];
        } else {
          throw new Error('Error: multirequest request failed');
        }
      })
      .catch((err: any) => {
        this._logger.error(err);
        throw new Error('Error: failed to multirequest of register requests' + JSON.stringify(err));
      });
  }
}
