interface DataAggregatorProps {
  throttleTimeout?: number;
  onTimeoutFn: (data: any) => void;
}

export class DataAggregator {
  private _data: any[] = [];
  private _timerId: NodeJS.Timeout | null = null;
  private _throttleTimeout = 250;
  private _onTimeoutFn: (data: any) => void;

  constructor(options: DataAggregatorProps) {
    this._onTimeoutFn = options.onTimeoutFn;
  }

  public addData(data: any): void {
    this._data.push(data);
    if (!this._timerId) {
      this._timerId = setTimeout(() => {
        this._useData();
        this._clearData();
        this._timerId = null;
      }, this._throttleTimeout);
    }
  }

  private _useData(): void {
    if (this._data.length > 0) {
      this._onTimeoutFn(this._data);
    }
  }

  private _clearData(): void {
    this._data = [];
  }

  public destroy(): void {
    if (this._timerId) {
      clearTimeout(this._timerId);
      this._clearData();
    }
  }
}
