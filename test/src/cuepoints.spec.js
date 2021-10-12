import {setup, core} from 'kaltura-player-js';
import * as TestUtils from './utils/test-utils';
import {VodProvider} from '../../src/providers/vod/vod-provider';
import {LiveProvider} from '../../src/providers/live/live-provider';
import {Cuepoints} from '../../src';

describe('Cue points plugin', function () {
  let player, sandbox;
  const target = 'player-placeholder';
  const sources = {
    progressive: [
      {
        mimetype: 'video/mp4',
        url: 'https://www.w3schools.com/tags/movie.mp4',
        id: '1_rwbj3j0a_11311,applehttp'
      }
    ]
  };

  before(() => {
    TestUtils.createElement('DIV', target);
    const el = document.getElementById(target);
    el.style.height = '360px';
    el.style.width = '640px';
  });
  afterEach(() => {
    sandbox.restore();
    if (player.hasService('kalturaCuepoints')) {
      player.getService('kalturaCuepoints').reset();
    }
    player.destroy();
    player = null;
    TestUtils.removeVideoElementsFromTestPage();
  });
  after(() => {
    TestUtils.removeElement(target);
  });
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    player = setup({
      targetId: target,
      provider: {},
      plugins: {
        kalturaCuepoints: {}
      }
    });
  });

  describe('Check cue-point service', () => {
    it('should check cuepoint service has been registered in KP as service', () => {
      expect(player.hasService('kalturaCuepoints')).to.eql(true);
    });

    it('should try and fail to register to get "slides" cue points after change source ended', done => {
      player.addEventListener(player.Event.CHANGE_SOURCE_ENDED, () => {
        const cps = player.getService('kalturaCuepoints');
        cps.registerTypes([cps.CuepointType.SLIDE]);
        expect(cps._types.get(cps.CuepointType.SLIDE)).to.not.eql(true);
        done();
      });
      player.configure({sources});
    });

    it('should try and register to get "slides" cue points', () => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([cps.CuepointType.SLIDE]);
      expect(cps._types.get(cps.CuepointType.SLIDE)).to.eql(true);
    });

    it('should reset the service', done => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([cps.CuepointType.SLIDE]);
      player.addEventListener(player.Event.CHANGE_SOURCE_ENDED, () => {
        let providerDestroy = sandbox.spy(cps._provider, 'destroy');
        expect(cps._types.size).to.eql(1);
        cps.reset();
        expect(cps._types.size).to.eql(0);
        expect(cps._mediaLoaded).to.eql(false);
        providerDestroy.should.have.been.calledOnce;
        done();
      });
      player.configure({sources});
    });

    it('should not init provider if no-one type registered', done => {
      const cps = player.getService('kalturaCuepoints');
      player.addEventListener(player.Event.CHANGE_SOURCE_ENDED, () => {
        expect(cps._types.size).to.eql(0);
        expect(cps._provider).to.be.undefined;
        done();
      });
      player.configure({sources});
    });

    it('should init VOD provider', done => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([cps.CuepointType.SLIDE]);
      player.addEventListener(player.Event.CHANGE_SOURCE_ENDED, () => {
        expect(cps._provider).to.be.instanceOf(VodProvider);
        done();
      });
      player.configure({sources});
    });

    it('should init LIVE provider', done => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([cps.CuepointType.SLIDE]);
      player.isLive = () => true;
      player.addEventListener(player.Event.CHANGE_SOURCE_ENDED, () => {
        expect(cps._provider).to.be.instanceOf(LiveProvider);
        done();
      });
      player.configure({sources});
    });
  });
});
