# playkit-js-kaltura-cuepoints

Cue points plugin for the Kaltura Player JS.
Enables to register to one or more cue point type and receive the entry cue points

# How to

Registration should be done in plugin loadMedia plugin hook.

#### For example:

```js
loadMedia(){
    var cuePointService = this.player.getService('kalturaCuepoints');
    cuePointSerive.regiter([cuePointService.types.SLIDES]);
}
```

# License and Copyright Information

All code in this project is released under the [AGPLv3 license](http://www.gnu.org/licenses/agpl-3.0.html) unless a different license for a particular library is specified in the applicable library path.

Copyright © Kaltura Inc. All rights reserved.  
Authors and contributors: See [GitHub contributors list](https://github.com/kaltura/playkit-js-kaltura-cuepoints/graphs/contributors).
