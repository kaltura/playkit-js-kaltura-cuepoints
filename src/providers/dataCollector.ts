interface DataCollectorOptions {
  throttleTimeout?: number;
  onTimeoutFn: (data: any) => void;
}

export class DataCollector {
  private _collectedData: any[] = [];
  private _timerId: NodeJS.Timeout | null = null;
  private _throttleTimeout = 250;
  private _onTimeoutFn: (data: any) => void;

  constructor(options: DataCollectorOptions) {
    this._onTimeoutFn = options.onTimeoutFn;
  }

  public collectData(data: any): void {
    this._collectedData.push(data);
    if (!this._timerId) {
      this._timerId = setTimeout(() => {
        this._useCollectedData();
        this._clearCollectedData();
        this._timerId = null;
      }, this._throttleTimeout);
    }
  }

  private _useCollectedData(): void {
    if (this._collectedData.length > 0) {
      this._onTimeoutFn(this._collectedData);
    }
  }

  private _clearCollectedData(): void {
    this._collectedData = [];
  }

  public destroy(): void {
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._clearCollectedData();
    }
  }
}
