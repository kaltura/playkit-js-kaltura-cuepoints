import Player = KalturaPlayerTypes.Player;
import EventManager = KalturaPlayerTypes.EventManager;
import {CuePoint} from '../types';

interface PendingCuesManagerProps {
  timeUpdateDelta?: number;
  player: Player;
  eventManager: EventManager;
}

export class PendingCuesManager {
  protected _eventManager: EventManager;
  protected _player: Player;
  private _timeUpdateDelta: number;
  private _lastPositionCuePointsPushed: number = 0;
  private _pendingCuePointsData: CuePoint[][] = [];
  private _activeListener = false;

  constructor(options: PendingCuesManagerProps) {
    this._player = options.player;
    this._timeUpdateDelta = options.timeUpdateDelta || 400;
    this._eventManager = options.eventManager;
  }

  public addCuePoint(cp: CuePoint[]): void {
    this._addListener();
    this._pendingCuePointsData.push(cp);
  }

  public checkCues(): void {
    this._pushCuePointsToPlayer();
  }

  private _pushCuePointsToPlayer(): void {
    for (const pendingCuePoints of this._pendingCuePointsData) {
      let cpToAdd: any[] = [];
      for (let index = 0; index < pendingCuePoints.length; index++) {
        const cp = pendingCuePoints[index];
        if (Math.floor(cp.startTime) <= this._player.currentTime) {
          cpToAdd.push(cp);
        } else {
          // next cue points will have greater start time, no need to continue the loop
          break;
        }
      }
      // remove cue points from pending array, that are going to be pushed
      pendingCuePoints.splice(0, cpToAdd.length);
      if (cpToAdd.length) {
        this._player.cuePointManager.addCuePoints(cpToAdd);
      }
    }

    if (this._pendingCuePointsData.every(pendingCues => pendingCues.length === 0)) {
      // clear _pendingCuePointsData and remove listener if pending arrays are empty
      this._pendingCuePointsData = [];
      this._removeListener();
    }
  }

  private _onTimeUpdate = (): void => {
    if (this._player.currentTime * 1000 - this._lastPositionCuePointsPushed >= this._timeUpdateDelta) {
      this._pushCuePointsToPlayer();
      // Update the last time that cue points were pushed to player
      this._lastPositionCuePointsPushed = this._player.currentTime * 1000;
    }
  };

  private _addListener = (): void => {
    if (!this._activeListener) {
      this._eventManager.listen(this._player, this._player.Event.TIME_UPDATE, this._onTimeUpdate);
      this._activeListener = true;
    }
  };

  private _removeListener = (): void => {
    if (this._activeListener) {
      this._eventManager.unlisten(this._player, this._player.Event.TIME_UPDATE, this._onTimeUpdate);
      this._activeListener = false;
    }
  };

  public destroy(): void {
    this._lastPositionCuePointsPushed = 0;
    this._pendingCuePointsData = [];
    this._removeListener();
  }
}
