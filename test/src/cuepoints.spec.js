import {setup} from 'kaltura-player-js';
import * as TestUtils from './utils/test-utils';
import {core} from 'kaltura-player-js';
import {Cuepoints} from '../../src';
const {EventType, FakeEvent, Cue} = core;

describe('Cue points plugin', function () {
  let player, sandbox;
  const target = 'player-placeholder';
  const sourcesConfig = {
    sources: {
      progressive: [
        {
          mimetype: 'video/mp4',
          url: 'https://www.w3schools.com/tags/movie.mp4'
        }
      ]
    }
  };

  before(() => {
    TestUtils.createElement('DIV', target);
    const el = document.getElementById(target);
    el.style.height = '360px';
    el.style.width = '640px';
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

  describe('Cue points', () => {
    it('should check cuepoint service has been registered in KP as service', done => {
      if (player.hasService('kalturaCuepoints')) {
        done();
      }
    });

    it('should try and register to get "slides" cue points', done => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([cps.CuepointType.Slides]);
      expect(cps._types.get(cps.CuepointType.Slides)).to.eql(true);
      done();
    });

    it('should try and fail to register to get "slides" cue points after change source ended', done => {
      const cps = player.getService('kalturaCuepoints');
      player.configure(sourcesConfig);
      cps.registerTypes([cps.CuepointType.Slides]);
      expect(cps._types.get(cps.CuepointType.Slides)).to.not.eql(true);
      done();
    });

    it('should reset the service', done => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([cps.CuepointType.Slides]);
      player.configure(sourcesConfig);
      let providerDestroy = sandbox.spy(cps._provider, 'destroy');

      cps.reset();
      expect(cps._types.size).to.eql(0);
      expect(cps._mediaLoaded).to.eql(false);
      providerDestroy.should.have.been.calledOnce;
      done();
    });
  });
});
