import {setup} from 'kaltura-player-js';
import * as TestUtils from './utils/test-utils';
import {core} from 'kaltura-player-js';
import {CuepointType} from '../../src/constants';
const {EventType, FakeEvent, Cue} = core;

describe('Cue points plugin', function () {
  let player, sandbox;
  const target = 'player-placeholder';

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
      id: '1_rwbj3j0a',
      sources: {
        progressive: [
          {
            mimetype: 'video/mp4',
            url: 'https://www.w3schools.com/tags/movie.mp4',
            id: '1_rwbj3j0a_11311,applehttp'
          }
        ]
      },
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

  describe.skip('Cue points', () => {
    it('should check cuepoint service has been registered in KP as service', () => {
      expect(player.hasService('kalturaCuepoints')).to.eql(true);
    });

    it('should try and register to get "slides" cue points', () => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([CuepointType.SLIDE]);
      expect(cps._types.get(CuepointType.SLIDE)).to.eql(true);
    });

    it('should try and fail to register to get "slides" cue points after change source ended', () => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([CuepointType.SLIDE]);
      expect(cps._types.get(CuepointType.SLIDE)).to.not.eql(true);
    });

    it('should reset the service', () => {
      const cps = player.getService('kalturaCuepoints');
      cps.registerTypes([CuepointType.SLIDE]);
      let providerDestroy = sandbox.spy(cps._provider, 'destroy');

      cps.reset();
      expect(cps._types.size).to.eql(0);
      expect(cps._mediaLoaded).to.eql(false);
      providerDestroy.should.have.been.calledOnce;
    });
  });
});
