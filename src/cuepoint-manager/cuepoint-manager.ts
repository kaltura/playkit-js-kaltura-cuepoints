// @ts-ignore;
import {core} from 'kaltura-player-js';
import {CuepointEngine} from './cuepoint-engine';
import {CuePoint} from '../types';

export class CuePointManager {
  private _engine: CuepointEngine<CuePoint> | null = null;
  private _activeCuePoints: Array<CuePoint> = [];
  private _allCuePoints: Array<CuePoint> = [];

  constructor(private _player: KalturaPlayerTypes.Player, private _eventManager: KalturaPlayerTypes.EventManager) {
    this._eventManager.listen(this._player, this._player.Event.TIME_UPDATE, this._getActiveCuePoints);
  }

  public get allCuePoints() {
    return this._allCuePoints;
  }

  public get activeCuePoints() {
    return this._activeCuePoints;
  }

  public addCuePoints = (cuePoints: Array<CuePoint>) => {
    if (!cuePoints || cuePoints.length === 0) {
      return;
    }
    this._player.ready().then(() => {
      const newCuePoints: Array<core.TimedMetadata> = cuePoints.map(cuePoint => {
        return {
          ...cuePoint,
          type: core.TimedMetadata.TYPE.CUE_POINT
        };
      });
      this._player.dispatchEvent(new core.FakeEvent(core.EventType.TIMED_METADATA_ADDED, {cues: newCuePoints}));

      this._allCuePoints = [...this._allCuePoints, ...newCuePoints];
      this._engine = new CuepointEngine(this._allCuePoints);
      this._activeCuePoints = [];
      this._getActiveCuePoints(null, true);
    });
  };

  private _setActiveCuePoints = (activeCuePoints: Array<CuePoint>) => {
    this._activeCuePoints = activeCuePoints;
    this._player.dispatchEvent(new core.FakeEvent(core.EventType.TIMED_METADATA_CHANGE, {cues: this._activeCuePoints}));
  };

  private _getActiveCuePoints = (event: unknown, forceSnapshot = false) => {
    if (!this._engine) {
      return;
    }

    const activeCuePoints = this._engine.updateTime(this._player.currentTime, forceSnapshot);
    // compare current active cuePoints list with data from snapshot and dispatch TIMED_METADATA_CHANGE event if needed
    if (
      activeCuePoints.snapshot &&
      activeCuePoints.snapshot.length > 0 &&
      (activeCuePoints.snapshot.length !== this._activeCuePoints.length ||
        activeCuePoints.snapshot[0]?.id !== this._activeCuePoints[0]?.id ||
        activeCuePoints.snapshot[activeCuePoints.snapshot.length - 1]?.id !== this._activeCuePoints[this._activeCuePoints.length - 1]?.id)
    ) {
      this._setActiveCuePoints(activeCuePoints.snapshot);
    }
    if (!activeCuePoints.delta) {
      return;
    }

    const {show, hide} = activeCuePoints.delta;
    if (show.length > 0 || hide.length > 0) {
      // update current cuePoints list with cuePoints from show and hide arrays
      this._activeCuePoints = this._activeCuePoints.filter(cuePoint => {
        return !hide.find(hCuePoint => cuePoint.id === hCuePoint.id);
      });
      this._setActiveCuePoints([...this._activeCuePoints, ...show]);
    }
  };

  public destroy() {
    this._engine = null;
    this._eventManager.unlisten(this._player, this._player.Event.TIME_UPDATE, this._getActiveCuePoints);
  }
}
