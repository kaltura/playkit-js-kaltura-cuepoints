# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.5.3](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.5.2...v1.5.3) (2022-05-04)


### Bug Fixes

* **FEV-1249:** use KS for thumbnails only if configured "loadThumbnailWithKs" property ([#24](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/24)) ([c4f6c1a](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/c4f6c1a))



### [1.5.2](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.5.1...v1.5.2) (2022-05-02)


### Bug Fixes

* **FEV-1225:** most of the times the first quiz (00:00:00) is not presented to the user (video will pass that point) ([#23](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/23)) ([27cce97](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/27cce97))



### [1.5.1](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.5.0...v1.5.1) (2022-03-29)


### Bug Fixes

* **FEV-1197:** advanced sort of cue-points ([#22](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/22)) ([1bf1b8b](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/1bf1b8b))



## [1.5.0](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.4.0...v1.5.0) (2022-02-14)


### Bug Fixes

* **FEV-1085:** only first cue point with same end\start time become active  ([#19](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/19)) ([99932b5](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/99932b5))


### Features

* **FEV-1035:** quiz cue-points end-time ([#21](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/21)) ([6dcee15](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/6dcee15))



## [1.4.0](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.3.0...v1.4.0) (2022-01-23)


### Bug Fixes

* **FEV-1142:** set default time for veiw-change cue-points ([#17](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/17)) ([aabd4e8](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/aabd4e8))


### Features

* **FEV-1168:** Add "quiz" type of cue-points to Kaltura-cue-points plugin ([#18](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/18)) ([ed819d8](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/ed819d8))



## [1.3.0](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.2.4...v1.3.0) (2022-01-19)


### Bug Fixes

* **FEC-11873:** player doesn't load on IE11 - errors appear in the console ([#16](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/16)) ([c33a0c6](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/c33a0c6))


### Features

* **FEC-11608:** Provider - Expose default service Url ([#14](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/14)) ([737d625](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/737d625))
* **FEC-11761:** expose stream timed metadata - phase 2 ([#15](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/15)) ([9d42702](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/9d42702))



### [1.2.4](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.2.3...v1.2.4) (2021-10-28)


### Bug Fixes

* **FEV-1122:** switch layout fix ([#13](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/13)) ([2969ed9](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/2969ed9))



### [1.2.3](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.2.2...v1.2.3) (2021-10-26)


### Bug Fixes

* **FEV-1104:** slides are missing during live when no DVR is configured ([#12](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/12)) ([370c1f8](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/370c1f8))



### [1.2.2](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.2.1...v1.2.2) (2021-10-19)


### Bug Fixes

* **FEV-1079:** round startTime of thumb cue-points, fix cue-points endTime ([#11](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/11)) ([ad99144](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/ad99144))
* **FEV-1082:** adding object type to requests ([#10](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/10)) ([19fe73d](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/19fe73d))



### [1.2.1](https://github.com/kaltura/playkit-js-kaltura-cuepoints/compare/v1.2.0...v1.2.1) (2021-10-12)



## 1.2.0 (2021-10-12)


### Bug Fixes

* **FEV-993:** move ks retrieval till after callback ([#4](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/4)) ([de7f8ac](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/de7f8ac))


### Features

* **FEV-1011:** live provider ([#5](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/5)) ([12c3abe](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/12c3abe))
* **FEV-1099:** handle view change cue points ([#8](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/8)) ([9109cd0](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/9109cd0))
* **FEV-985:** cue point service ([#1](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/1)) ([79534a1](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/79534a1))
* **FEV-993:** implement VOD provider ([#2](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/2)) ([ec9eb2d](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/ec9eb2d))



## 1.1.0 (2021-10-12)


### Bug Fixes

* **FEV-993:** move ks retrieval till after callback ([#4](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/4)) ([de7f8ac](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/de7f8ac))


### Features

* **FEV-1011:** live provider ([#5](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/5)) ([12c3abe](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/12c3abe))
* **FEV-1099:** handle view change cue points ([#8](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/8)) ([9109cd0](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/9109cd0))
* **FEV-985:** cue point service ([#1](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/1)) ([79534a1](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/79534a1))
* **FEV-993:** implement VOD provider ([#2](https://github.com/kaltura/playkit-js-kaltura-cuepoints/issues/2)) ([ec9eb2d](https://github.com/kaltura/playkit-js-kaltura-cuepoints/commit/ec9eb2d))
