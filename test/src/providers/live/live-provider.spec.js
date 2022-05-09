import {setup} from 'kaltura-player-js';
import * as TestUtils from '../../utils/test-utils';
import {EventManager} from '@playkit-js/playkit-js';
import {LiveProvider} from '../../../../src/providers/live/live-provider';
import {PushNotificationPrivider} from '../../../../src/providers/live/push-notifications-provider';

describe('Check Live provider', () => {
  let player, sandbox, liveProvider;
  const target = 'player-placeholder';

  before(() => {
    TestUtils.createElement('DIV', target);
    const el = document.getElementById(target);
    el.style.height = '360px';
    el.style.width = '640px';
  });
  afterEach(() => {
    sandbox.restore();
    player.destroy();
    player = null;
    TestUtils.removeVideoElementsFromTestPage();
    liveProvider = null;
  });
  after(() => {
    TestUtils.removeElement(target);
  });
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    player = setup({
      targetId: target,
      provider: {}
    });
    liveProvider = new LiveProvider(player, new EventManager(), {debug: TestUtils.noop, info: TestUtils.noop}, new Map());
  });

  describe('Test Live provider instance', () => {
    it('should check initial state ', () => {
      expect(liveProvider._currentTimeLivePromise).to.be.instanceOf(Promise);
      expect(liveProvider._pushNotification).to.be.instanceOf(PushNotificationPrivider);
      expect(liveProvider._thumbCuePoints).to.eql([]);
      expect(liveProvider._slideViewChangeCuePoints).to.eql([]);
      expect(liveProvider._id3Timestamp).to.eq(0);
      expect(liveProvider._currentTime).to.eq(0);
      expect(liveProvider._currentTimeLive).to.eq(0);
      expect(liveProvider._seekDifference).to.eq(0);
    });

    it('should check pushNotification initialisation', () => {
      expect(liveProvider._pushNotification._initialized).to.eql(true);
    });

    it('should check event listener bindings', () => {
      expect(liveProvider._eventManager._bindingMap._map.size).to.eq(3);
    });

    it('should handle timed metadata', () => {
      expect(liveProvider._id3Timestamp).to.eq(0);
      liveProvider._onTimedMetadataLoaded({payload: {cues: [{value: {key: 'TEXT', data: '{"timestamp":1634054921374,"sequenceId":"32"}'}}]}});
      expect(liveProvider._id3Timestamp).to.eql(1634054922);
    });

    describe('Test time update', () => {
      beforeEach(() => {
        liveProvider._player = {currentTime: 5.5};
        liveProvider._id3Timestamp = null;
        liveProvider._seekDifference = null;
        liveProvider._currentTime = 6;
        liveProvider._currentTimeLive = 5;
      });
      it('should handle case when player.currentTime eq liveProvider._currentTime', () => {
        liveProvider._onTimeUpdate();
        expect(liveProvider._currentTime).to.eq(6);
        expect(liveProvider._currentTimeLive).to.eq(5);
      });
      it('should handle case when _seekDifference and _currentTimeLive defined', () => {
        liveProvider._currentTime = 5;
        liveProvider._seekDifference = 3;
        liveProvider._currentTimeLive = 5;
        liveProvider._onTimeUpdate();
        expect(liveProvider._currentTimeLive).to.eq(2);
      });
      it('should handle case when _id3Timestamp defined and _id3Timestamp eq _currentTimeLive', () => {
        liveProvider._currentTime = 5;
        liveProvider._currentTimeLive = 5;
        liveProvider._id3Timestamp = 5;
        liveProvider._onTimeUpdate();
        expect(liveProvider._currentTimeLive).to.eq(5);
        expect(liveProvider._id3Timestamp).to.be.null;
      });
      it('should handle case when _id3Timestamp defined and _id3Timestamp not eq _currentTimeLive', () => {
        liveProvider._currentTime = 5;
        liveProvider._currentTimeLive = 5;
        liveProvider._id3Timestamp = 6;
        liveProvider._onTimeUpdate();
        expect(liveProvider._currentTimeLive).to.eq(6);
        expect(liveProvider._id3Timestamp).to.be.null;
      });
      it('should handle case when _id3Timestamp and _seekDifference not defined', () => {
        liveProvider._currentTime = 7;
        liveProvider._currentTimeLive = 7;
        liveProvider._onTimeUpdate();
        expect(liveProvider._currentTimeLive).to.eq(8);
      });
    });

    it('should test _handleSeeking method', () => {
      liveProvider._currentTime = 7;
      liveProvider._player = {currentTime: 5.5};
      liveProvider._handleSeeking();
      expect(liveProvider._seekDifference).to.eq(2);
    });

    it('should test fixCuePointEndTime method', () => {
      const result = liveProvider._fixCuePointEndTime([
        {createdAt: 10, startTime: 10, endTime: Number.MAX_SAFE_INTEGER},
        {createdAt: 20, startTime: 20, endTime: Number.MAX_SAFE_INTEGER}
      ]);
      expect(result).to.eql([
        {createdAt: 10, startTime: 10, endTime: 20},
        {createdAt: 20, startTime: 20, endTime: Number.MAX_SAFE_INTEGER}
      ]);
    });

    it('should test prepareThumbCuePoints method', () => {
      const addCuePoints = sinon.spy();
      liveProvider._player = {
        currentTime: 5,
        config: {session: {ks: 'test_ks'}},
        provider: {env: {serviceUrl: 'test_url'}},
        cuePointManager: {addCuePoints}
      };
      liveProvider._currentTimeLive = 100;
      liveProvider._prepareThumbCuePoints({
        id: '1',
        assetId: 'test_id',
        createdAt: 96
      });
      const result = [
        {
          id: '1',
          assetId: 'test_id',
          startTime: 1,
          createdAt: 96,
          endTime: Number.MAX_SAFE_INTEGER,
          assetUrl: 'test_url/index.php/service/thumbAsset/action/serve/thumbAssetId/test_id'
        }
      ];
      const playerResult = [
        {
          id: '1',
          startTime: 1,
          endTime: Number.MAX_SAFE_INTEGER,
          metadata: {
            assetId: 'test_id',
            createdAt: 96,
            assetUrl: 'test_url/index.php/service/thumbAsset/action/serve/thumbAssetId/test_id'
          }
        }
      ];
      expect(liveProvider._thumbCuePoints).to.eql(result);
      addCuePoints.should.have.been.calledOnceWithExactly(playerResult);
    });

    it('should test _prepareViewChangeCuePoints method', () => {
      const addCuePoints = sinon.spy();
      liveProvider._player = {
        currentTime: 5,
        cuePointManager: {addCuePoints}
      };
      liveProvider._currentTimeLive = 100;
      liveProvider._prepareViewChangeCuePoints({
        id: '1',
        partnerData: '{"viewModeLockState":"locked"}',
        createdAt: 96
      });
      const result = [
        {
          id: '1',
          startTime: 1,
          createdAt: 96,
          endTime: Number.MAX_SAFE_INTEGER,
          partnerData: {viewModeLockState: 'locked'}
        }
      ];
      const playerResult = [
        {
          id: '1',
          startTime: 1,
          endTime: Number.MAX_SAFE_INTEGER,
          metadata: {
            createdAt: 96,
            partnerData: {viewModeLockState: 'locked'}
          }
        }
      ];
      expect(liveProvider._slideViewChangeCuePoints).to.eql(result);
      addCuePoints.should.have.been.calledOnceWithExactly(playerResult);
    });
  });
});
