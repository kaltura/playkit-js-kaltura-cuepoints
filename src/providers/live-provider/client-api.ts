import axios, {AxiosRequestConfig} from 'axios';

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

export interface RegisterRequestParams extends Record<string, any> {
  service: string;
  action: string;
  notificationTemplateSystemName: string;
  pushNotificationParams: PushNotificationParams;
}

export interface PushNotificationParams extends Record<string, any> {
  objectType: string;
  userParams: any;
}

interface BaseRequestParams extends Record<string, any> {
  apiVersion: string;
  expiry: string;
  ignoreNull: number;
  clientTag: string;
  ks: string;
  kalsig: string;
}

export function isAPIErrorResponse(
  response: RegisterRequestResponse
): response is APIErrorResponse {
  return response.objectType === 'KalturaAPIException';
}

export function isAPIResponse(response: any): response is APIResponse {
  return 'objectType' in response;
}

// const logger = getContribLogger({
//   module: 'contrib-push-notifications',
//   class: 'ClientApi',
// });

export class ClientApi {
  private readonly _baseParams: BaseRequestParams;
  private _serviceUrl: string;

  constructor(options: ClientApiOptions) {
    this._serviceUrl = options.serviceUrl + '/index.php';

    this._baseParams = {
      apiVersion: '3.1',
      expiry: '86400',
      ignoreNull: 1,
      clientTag: options.clientTag,
      ks: options.ks,
      kalsig: '', // Todo: MD5 hash code for the params object.
    };
  }

  public doMultiRegisterRequest(
    apiRequests: RegisterRequestParams[]
  ): Promise<void | RegisterRequestResponse[]> {
    const data = this._preparePostMultiData(apiRequests);
    const options: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    return axios
      .post(`${this._serviceUrl}?service=multirequest`, data, options)
      .then((res: any) => {
        if (
          !res ||
          !res.data ||
          res.data.objectType === 'KalturaAPIException'
        ) {
          throw new Error('Error: multirequest request failed');
        }

        return res.data as RegisterRequestResponse[];
      })
      .catch((err: Error) => {
        // logger.error(
        //   'failed to multirequest the queueNameHash and queueKeyHash',
        //   {
        //     method: `doMultiRegisterRequest`,
        //     data: {
        //       error: err,
        //     },
        //   }
        // );

        throw new Error(
          'Error: failed to multirequest of register requests' +
            JSON.stringify(err)
        );
      });
  }

  private _preparePostMultiData(apiRequests: RegisterRequestParams[]) {
    const data: any = {};

    const multiRequestIndex = 1;

    // Add base parameters
    for (const paramKey in this._baseParams) {
      if (typeof data[paramKey] === 'undefined') {
        data[paramKey] = this._baseParams[paramKey];
      }
    }

    // set format to JSON ( Access-Control-Allow-Origin:* )
    data['format'] = 1;
    data['action'] = 'null';

    // enumerate the request (1:xxx, 2:xxx...)
    for (let i = 0; i < apiRequests.length; i++) {
      const requestInx = multiRequestIndex + i;

      // MultiRequest pre-process each param with inx:param
      for (const paramKey in apiRequests[i]) {
        // support multi dimension array request:
        if (typeof apiRequests[i][paramKey] == 'object') {
          for (const subParamKey in apiRequests[i][paramKey]) {
            data[requestInx + ':' + paramKey + ':' + subParamKey] =
              apiRequests[i][paramKey][subParamKey];
          }
        } else {
          data[requestInx + ':' + paramKey] = apiRequests[i][paramKey];
        }
      }
    }

    return data;
  }
}
