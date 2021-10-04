const {RequestBuilder} = KalturaPlayer.providers;

export interface PushNotificationParams extends Record<string, any> {
  objectType: string;
  userParams: any;
}

export interface RegisterRequestParams extends Record<string, any> {
  service: string;
  action: string;
  notificationTemplateSystemName: string;
  pushNotificationParams: PushNotificationParams;
}

export class PushNotificationLoader implements KalturaPlayerTypes.ILoader {
  _requests: any[] = [];
  _response: any = {};
  static get id(): string {
    return 'cuepoint-service';
  }
  constructor(private _apiRequests: RegisterRequestParams[]) {
    const headers: Map<string, string> = new Map();
    _apiRequests.forEach(apiRequest => {
      const request = new RequestBuilder(headers);
      const {action, service, ...other} = apiRequest;
      request.action = action;
      request.service = service;
      request.params = {
        ...other
      };
      this.requests.push(request);
    });
  }

  set requests(requests: any[]) {
    this._requests = requests;
  }
  get requests(): any[] {
    return this._requests;
  }
  set response(response: any) {
    this._response = response.map((res: any) => res.data);
  }
  get response(): any {
    return this._response;
  }
  isValid(): boolean {
    return this._apiRequests.length > 0;
  }
}
