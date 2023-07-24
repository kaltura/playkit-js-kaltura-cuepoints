declare module "types" {
    export type CuepointTypeMap = Map<string, boolean>;
    export enum KalturaThumbCuePointSubType {
        SLIDE = 1,
        CHAPTER = 2
    }
    export enum KalturaCuePointType {
        PUBLIC_QNA = "publicqna",
        USER_QNA = "userqna",
        CODE_QNA = "codeqna",
        QUIZ = "quiz",
        SLIDE = "slide",
        VIEW_CHANGE = "viewchange",
        CHAPTER = "chapter",
        HOTSPOT = "hotspot",
        CAPTION = "caption"
    }
    export enum CuePointTags {
        ANSWERONAIR = "qna",
        HOTSPOT = "hotspots"
    }
    export interface CuePoint {
        id: string;
        startTime: number;
        endTime: number;
        metadata: Record<string, any>;
    }
}
declare module "cuepoint-manager/cuepoint-engine" {
    export interface Cuepoint {
        startTime: number;
        endTime?: number;
    }
    export interface CuepointEngineOptions {
        reasonableSeekThreshold: number;
    }
    export interface UpdateTimeResponse<T extends Cuepoint> {
        snapshot?: T[];
        delta?: {
            show: T[];
            hide: T[];
        };
    }
    export class CuepointEngine<T extends Cuepoint> {
        protected _cuepoints: T[];
        private reasonableSeekThreshold;
        private isFirstTime;
        protected enabled: boolean;
        private lastHandledTime;
        private lastHandledTimeIndex;
        private nextTimeToHandle;
        private cuepointChanges;
        constructor(cuepoints: T[], options?: CuepointEngineOptions);
        get cuepoints(): T[];
        getSnapshot(time: number): T[];
        updateTime(currentTime: number, forceSnapshot?: boolean, filter?: (item: T) => boolean): UpdateTimeResponse<T>;
        protected getCurrentCuepointSnapshot(): T[];
        private createCuepointSnapshot;
        private createCuepointDelta;
        private updateInternals;
        private createEmptyDelta;
        private binarySearch;
        private findClosestLastIndexByTime;
        private prepareCuepoint;
    }
}
declare module "cuepoint-manager/cuepoint-manager" {
    import { CuePoint } from "types";
    export class CuePointManager {
        private _player;
        private _eventManager;
        private _engine;
        private _activeCuePoints;
        private _allCuePoints;
        constructor(_player: KalturaPlayerTypes.Player, _eventManager: KalturaPlayerTypes.EventManager);
        get allCuePoints(): CuePoint[];
        get activeCuePoints(): CuePoint[];
        addCuePoints: (cuePoints: Array<CuePoint>) => void;
        private _setActiveCuePoints;
        private _getActiveCuePoints;
        destroy(): void;
    }
}
declare module "cuepoint-manager/index" {
    export * from "cuepoint-manager/cuepoint-manager";
}
declare module "providers/provider" {
    import { CuepointTypeMap } from "types";
    import { CuePointManager } from "cuepoint-manager/index";
    import Player = KalturaPlayerTypes.Player;
    import Logger = KalturaPlayerTypes.Logger;
    import EventManager = KalturaPlayerTypes.EventManager;
    export interface ProviderRequest {
        loader: Function;
        params: any;
    }
    export class Provider {
        protected _types: Map<string, boolean>;
        protected _player: Player;
        protected _eventManager: EventManager;
        protected _logger: Logger;
        cuePointManager: CuePointManager | null;
        constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap);
        protected _addCuePointToPlayer(cuePoints: any[]): void;
        destroy(): void;
    }
}
declare module "providers/vod/response-types/kaltura-cue-point" {
    export class KalturaCuePoint {
        static KalturaCuePointType: {
            [type: string]: string;
        };
        static KalturaCuePointStatus: {
            [type: string]: number;
        };
        /**
         * @member - The cue point id
         * @type {string}
         */
        id: string;
        /**
         * @member - The cue point intId
         * @type {number}
         */
        intId: number;
        /**
         * @member - The cue point type
         * @type {string}
         */
        cuePointType: string;
        /**
         * @member - The cue point status
         * @type {number}
         */
        status: number;
        /**
         * @member - The entry id
         * @type {string}
         */
        entryId: string;
        /**
         * @member - The partner id
         * @type {number}
         */
        partnerId: number;
        /**
         * @member - The cue point creation date
         * @type {Date}
         */
        createdAt: Date;
        /**
         * @member - The cue point update date
         * @type {Date}
         */
        updatedAt: Date;
        /**
         * @member - The cue point trigger date
         * @type {Date}
         */
        triggeredAt: Date;
        /**
         * @member - The cue point start time
         * @type {Date}
         */
        startTime: number;
        /**
         * @member - The cue point partner
         * @type {string}
         */
        partnerData: string;
        constructor(cuePoint: any);
    }
}
declare module "providers/vod/response-types/kaltura-code-cue-point" {
    import { KalturaCuePoint } from "providers/vod/response-types/kaltura-cue-point";
    export class KalturaCodeCuePoint extends KalturaCuePoint {
        /**
         * @member - The CodeCuePoint code
         * @type {string}
         */
        code: string;
        /**
         * @member - The CodeCuePoint description
         * @type {string}
         */
        description: string;
        /**
         * @member - The CodeCuePoint end time
         * @type {string}
         */
        endTime: number;
        /**
         * @member - The duration of the CodeCuePoint
         * @type {number}
         */
        duration: number;
        /**
         * @member - The cue point tags
         * @type {string}
         */
        tags: string;
        constructor(codeCuePoint: any);
    }
}
declare module "providers/vod/response-types/kaltura-thumb-cue-point" {
    import { KalturaCuePoint } from "providers/vod/response-types/kaltura-cue-point";
    import { KalturaThumbCuePointSubType } from "types";
    export class KalturaThumbCuePoint extends KalturaCuePoint {
        /**
         * @member - The ThumbCuePoint asset id
         * @type {string}
         */
        assetId: string;
        /**
         * @member - The ThumbCuePoint description
         * @type {string}
         */
        description: string;
        /**
         * @member - The ThumbCuePoint title
         * @type {string}
         */
        title: string;
        /**
         * @member - The sub type of the ThumbCuePoint
         * @type {number}
         */
        subType: KalturaThumbCuePointSubType;
        constructor(thumbCuePoint: any);
    }
}
declare module "providers/vod/response-types/kaltura-cue-point-list-response" {
    import { KalturaCuePoint } from "providers/vod/response-types/kaltura-cue-point";
    export class KalturaCuePointListResponse<KalturaCuePointType extends KalturaCuePoint> {
        /**
         * @member - The total count
         * @type {number}
         */
        totalCount: number;
        /**
         * @member - The entries
         * @type {Array<KalturaThumbCuePoint>}
         */
        cuePoints: Array<KalturaCuePointType>;
        /**
         * @constructor
         * @param {Object} responseObj The json response
         */
        constructor(responseObj: any, type: {
            new (cuePoint: any): KalturaCuePointType;
        });
    }
}
declare module "providers/vod/response-types/kaltura-quiz-question-cue-point" {
    import { KalturaCuePoint } from "providers/vod/response-types/kaltura-cue-point";
    export enum KalturaQuestionType {
        fillInBlank = 5,
        goTo = 7,
        hotSpot = 6,
        multipleAnswerQuestion = 4,
        multipleChoiceAnswer = 1,
        openQuestion = 8,
        reflectionPoint = 3,
        trueFalse = 2
    }
    export interface OptionalAnswer {
        isCorrect: boolean;
        key: string;
        objectType: string;
        text?: string;
        weight: number;
    }
    export class KalturaQuizQuestionCuePoint extends KalturaCuePoint {
        excludeFromScore: boolean;
        objectType: string;
        optionalAnswers: Array<OptionalAnswer>;
        hint?: string;
        explanation?: string;
        question: string;
        questionType: KalturaQuestionType;
        userId: string;
        constructor(codeCuePoint: any);
    }
}
declare module "providers/vod/response-types/kaltura-hotspot-cue-point" {
    import { KalturaCuePoint } from "providers/vod/response-types/kaltura-cue-point";
    import { CuePointTags } from "types";
    export class KalturaHotspotCuePoint extends KalturaCuePoint {
        text: string;
        endTime?: number;
        tags?: CuePointTags;
        constructor(hotspotCuePoint: any);
    }
}
declare module "providers/vod/response-types/kaltura-caption" {
    interface CaptionContent {
        text: string;
    }
    interface Caption {
        startTime: number;
        endTime: number;
        content: Array<CaptionContent>;
    }
    export class KalturaCaption {
        id: string;
        startTime: number;
        endTime: number;
        content: Array<{
            text: string;
        }>;
        cuePointType: string;
        constructor(caption: Caption, id: string);
    }
}
declare module "providers/vod/response-types/index" {
    export * from "providers/vod/response-types/kaltura-cue-point";
    export * from "providers/vod/response-types/kaltura-code-cue-point";
    export * from "providers/vod/response-types/kaltura-thumb-cue-point";
    export * from "providers/vod/response-types/kaltura-cue-point-list-response";
    export * from "providers/vod/response-types/kaltura-quiz-question-cue-point";
    export * from "providers/vod/response-types/kaltura-hotspot-cue-point";
    export * from "providers/vod/response-types/kaltura-caption";
}
declare module "providers/vod/thumb-loader" {
    import ILoader = KalturaPlayerTypes.ILoader;
    import { KalturaThumbCuePoint } from "providers/vod/response-types/index";
    interface KalturaThumbCuePointsResponse {
        thumbCuePoints: Array<KalturaThumbCuePoint>;
    }
    export class ThumbLoader implements ILoader {
        _entryId: string;
        _requests: any[];
        _response: KalturaThumbCuePointsResponse;
        static get id(): string;
        /**
         * @constructor
         * @param {Object} params loader params
         */
        constructor(params: {
            entryId: string;
            subTypesFilter: string;
        });
        set requests(requests: any[]);
        get requests(): any[];
        set response(response: any);
        get response(): any;
        /**
         * Loader validation function
         * @function
         * @returns {boolean} Is valid
         */
        isValid(): boolean;
    }
}
declare module "providers/utils" {
    export function isEmptyObject(obj: Record<string, any>): boolean;
    export function getDomainFromUrl(url: string): string;
    export function makeAssetUrl(baseThumbAssetUrl: string, assetId: string): string;
    export function generateThumb(serviceUrl: string, partnerId: string | undefined, entryId: string, startTime: number, ks?: string): string;
    export function sortArrayBy<T>(cuePoints: T[], primarySortKey: string, secondarySortKey?: string): T[];
}
declare module "providers/vod/view-change-loader" {
    import ILoader = KalturaPlayerTypes.ILoader;
    import { KalturaCuePoint } from "providers/vod/response-types/index";
    interface KalturaViewChangeCuePointsResponse {
        viewChangeCuePoints: Array<KalturaCuePoint>;
    }
    export class ViewChangeLoader implements ILoader {
        _entryId: string;
        _requests: any[];
        _response: KalturaViewChangeCuePointsResponse;
        static get id(): string;
        /**
         * @constructor
         * @param {Object} params loader params
         */
        constructor(params: {
            entryId: string;
        });
        set requests(requests: any[]);
        get requests(): any[];
        set response(response: any);
        get response(): any;
        /**
         * Loader validation function
         * @function
         * @returns {boolean} Is valid
         */
        isValid(): boolean;
    }
}
declare module "providers/vod/quiz-question-loader" {
    import ILoader = KalturaPlayerTypes.ILoader;
    import { KalturaQuizQuestionCuePoint } from "providers/vod/response-types/index";
    interface KalturaQuizQuestionCuePointsResponse {
        quizQuestionCuePoints: Array<KalturaQuizQuestionCuePoint>;
    }
    export class QuizQuestionLoader implements ILoader {
        _entryId: string;
        _requests: any[];
        _response: KalturaQuizQuestionCuePointsResponse;
        static get id(): string;
        constructor(params: {
            entryId: string;
        });
        set requests(requests: any[]);
        get requests(): any[];
        set response(response: any);
        get response(): any;
        isValid(): boolean;
    }
}
declare module "providers/vod/hotspot-loader" {
    import ILoader = KalturaPlayerTypes.ILoader;
    import { KalturaHotspotCuePoint } from "providers/vod/response-types/index";
    interface KalturaHotSpotCuePointsResponse {
        hotspotCuePoints: Array<KalturaHotspotCuePoint>;
    }
    export class HotspotLoader implements ILoader {
        _entryId: string;
        _requests: any[];
        _response: KalturaHotSpotCuePointsResponse;
        static get id(): string;
        /**
         * @constructor
         * @param {Object} params loader params
         */
        constructor(params: {
            entryId: string;
            subTypesFilter: string;
        });
        set requests(requests: any[]);
        get requests(): any[];
        set response(response: any);
        get response(): any;
        /**
         * Loader validation function
         * @function
         * @returns {boolean} Is valid
         */
        isValid(): boolean;
    }
}
declare module "providers/common/thumb-url-loader" {
    import ILoader = KalturaPlayerTypes.ILoader;
    export class ThumbUrlLoader implements ILoader {
        _thumbAssetId: string;
        _requests: any[];
        _response: string;
        static get id(): string;
        /**
         * @constructor
         * @param {Object} params loader params
         */
        constructor(params: {
            thumbAssetId: string;
        });
        set requests(requests: any[]);
        get requests(): any[];
        set response(response: any);
        get response(): any;
        /**
         * Loader validation function
         * @function
         * @returns {boolean} Is valid
         */
        isValid(): boolean;
    }
}
declare module "providers/vod/caption-loader" {
    import ILoader = KalturaPlayerTypes.ILoader;
    import { KalturaCaption } from "providers/vod/response-types/index";
    interface CaptionResponse {
        captions: Array<KalturaCaption>;
    }
    export class CaptionLoader implements ILoader {
        _captionAssetId: string;
        _requests: any[];
        _response: CaptionResponse;
        static get id(): string;
        /**
         * @constructor
         * @param {Object} params loader params
         */
        constructor(params: {
            captionAssetId: string;
        });
        set requests(requests: any[]);
        get requests(): any[];
        set response(response: any);
        get response(): any;
        /**
         * Loader validation function
         * @function
         * @returns {boolean} Is valid
         */
        isValid(): boolean;
    }
}
declare module "providers/vod/vod-provider" {
    import { Provider } from "providers/provider";
    import { CuepointTypeMap } from "types";
    import Player = KalturaPlayerTypes.Player;
    import Logger = KalturaPlayerTypes.Logger;
    import EventManager = KalturaPlayerTypes.EventManager;
    export class VodProvider extends Provider {
        private _fetchedCaptionKeys;
        private _fetchingCaptionKey;
        constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap);
        private _addListeners;
        private _removeListeners;
        private _fetchVodData;
        private _fixCuePointsEndTime;
        private _handleLanguageChange;
        private _loadCaptions;
        private _handleViewChangeResponse;
        private _handleThumbResponse;
        private _handleQuizQustionResponse;
        private _handleHotspotResponse;
        destroy(): void;
    }
}
declare module "providers/live/push-notification-loader" {
    export interface PushNotificationParams extends Record<string, any> {
        objectType: string;
        userParams: any;
    }
    export interface RegisterRequestParams extends Record<string, any> {
        service: string;
        action: string;
        notificationTemplateSystemName: string;
        pushNotificationParams: PushNotificationParams;
    }
    export class PushNotificationLoader implements KalturaPlayerTypes.ILoader {
        private _apiRequests;
        _requests: any[];
        _response: any;
        static get id(): string;
        constructor(_apiRequests: RegisterRequestParams[]);
        set requests(requests: any[]);
        get requests(): any[];
        set response(response: any);
        get response(): any;
        isValid(): boolean;
    }
}
declare module "providers/live/socket-wrapper" {
    export interface ListenKeysObject {
        eventName: string;
        queueNameHash: string;
        queueKeyHash: string;
        onMessage: Function[];
    }
    export interface SocketWrapperParams {
        key: string;
        url: string;
        onSocketDisconnect?: Function | undefined;
        onSocketReconnect?: Function | undefined;
    }
    export class SocketWrapper {
        private _logger;
        static CONNECTION_TIMEOUT: number;
        private _socket;
        private _listenKeys;
        private _messageKeyToQueueKeyMap;
        private _connected;
        constructor(socketWrapperParams: SocketWrapperParams, _logger: KalturaPlayerTypes.Logger);
        destroy(): void;
        private _connectAndListenToSocket;
        prepareForListening(eventName: string, queueNameHash: string, queueKeyHash: string, onMessage: Function): void;
    }
}
declare module "providers/live/push-notifications" {
    export interface EventParams extends Record<string, any> {
        entryId: string;
        userId?: string;
    }
    export interface PrepareRegisterRequestConfig {
        eventName: string;
        eventParams?: EventParams;
        onMessage: Function;
    }
    export interface RegisterNotificationsParams {
        prepareRegisterRequestConfigs: PrepareRegisterRequestConfig[];
        onSocketDisconnect?: Function;
        onSocketReconnect?: Function;
    }
    export interface APINotificationResponse extends APIResponse {
        url: string;
        queueName: string;
        queueKey: string;
    }
    export interface APIResponse {
        objectType: string;
    }
    export interface RegisterRequestResponse extends APIResponse {
        queueKey: string;
        queueName: string;
        url: string;
    }
    export interface APIErrorResponse extends RegisterRequestResponse {
        objectType: string;
        code: string;
        message: string;
    }
    export function isAPINotificationResponse(response: APIResponse): response is APINotificationResponse;
    export function isAPIErrorResponse(response: RegisterRequestResponse): response is APIErrorResponse;
    export class PushNotifications {
        private _player;
        private _logger;
        private _socketPool;
        constructor(player: KalturaPlayerTypes.Player, logger: KalturaPlayerTypes.Logger);
        private _onPlayerReset;
        reset(): void;
        registerNotifications(registerNotifications: RegisterNotificationsParams): Promise<void>;
        private _prepareRegisterRequest;
        private _processResult;
    }
}
declare module "providers/live/push-notifications-provider" {
    import { EventsManager } from '@playkit-js/common/dist/utils-common';
    import { CuepointTypeMap } from "types";
    export interface PushNotificationData {
        cuePointType: string;
        entryId: string;
        id: string;
        objectType: string;
        partnerData: string;
        partnerId: number;
        startTime: number;
        status: number;
        tags: string;
        createdAt: number;
        updatedAt: number;
    }
    export interface ThumbPushNotificationData extends PushNotificationData {
        endTime?: number;
        assetId: string;
        subType: number;
    }
    export interface SlideViewChangePushNotificationData extends PushNotificationData {
        endTime?: number;
        duration: number;
        code: string;
    }
    export interface QnaPushNotificationData extends PushNotificationData {
        endTime?: number;
        relatedObjects: {
            QandA_ResponseProfile: {
                objectType: 'KalturaMetadataListResponse';
                totalCount: number;
                objects: Array<KalturaMetadata>;
            };
        };
        text: string;
    }
    export interface KalturaMetadata {
        createdAt: number;
        id: number;
        objectId: string;
        objectType: 'KalturaMetadata';
        xml: string;
    }
    export enum PushNotificationEventTypes {
        PushNotificationsError = "PUSH_NOTIFICATIONS_ERROR",
        ThumbNotification = "THUMB_CUE_POINT_READY_NOTIFICATION",
        SlideViewChangeNotification = "SLIDE_VIEW_CHANGE_CODE_CUE_POINT",
        PublicNotifications = "PUBLIC_QNA_NOTIFICATIONS",
        UserNotifications = "USER_QNA_NOTIFICATIONS",
        CodeNotifications = "CODE_QNA_NOTIFICATIONS"
    }
    export interface PublicNotificationsEvent {
        type: PushNotificationEventTypes.PublicNotifications;
        messages: QnaPushNotificationData[];
    }
    export interface NotificationsErrorEvent {
        type: PushNotificationEventTypes.PushNotificationsError;
        error: string;
    }
    export interface ThumbNotificationsEvent {
        type: PushNotificationEventTypes.ThumbNotification;
        thumbs: ThumbPushNotificationData[];
    }
    export interface SlideViewChangeNotificationsEvent {
        type: PushNotificationEventTypes.SlideViewChangeNotification;
        slideViewChanges: SlideViewChangePushNotificationData[];
    }
    export interface UserQnaNotificationsEvent {
        type: PushNotificationEventTypes.UserNotifications;
        messages: QnaPushNotificationData[];
    }
    export interface SettingsNotificationsEvent {
        type: PushNotificationEventTypes.CodeNotifications;
        settings: QnaPushNotificationData[];
    }
    type Events = ThumbNotificationsEvent | SlideViewChangeNotificationsEvent | PublicNotificationsEvent | NotificationsErrorEvent | UserQnaNotificationsEvent | SettingsNotificationsEvent;
    /**
     * handles push notification registration and results.
     */
    export class PushNotificationPrivider {
        private _player;
        private _logger;
        private _pushServerInstance;
        private _registeredToMessages;
        private _events;
        private _initialized;
        on: EventsManager<Events>['on'];
        off: EventsManager<Events>['off'];
        constructor(_player: KalturaPlayerTypes.Player, _logger: KalturaPlayerTypes.Logger);
        init(): void;
        /**
         * should be called on mediaUnload
         */
        reset(): void;
        registerToPushServer(entryId: string, types: CuepointTypeMap, onSuccess: () => void, onError: () => void): void;
        private _createThumbRegistration;
        private _createSlideViewChangeRegistration;
        private _createPublicQnaRegistration;
        private _createUserQnaRegistration;
        private _createCodeQnaRegistration;
    }
}
declare module "providers/live/live-provider" {
    import { Provider } from "providers/provider";
    import { CuepointTypeMap } from "types";
    import Player = KalturaPlayerTypes.Player;
    import Logger = KalturaPlayerTypes.Logger;
    import EventManager = KalturaPlayerTypes.EventManager;
    export class LiveProvider extends Provider {
        private _pushNotification;
        private _thumbCuePoints;
        private _slideViewChangeCuePoints;
        private _id3Timestamp;
        private _currentTime;
        private _currentTimeLive;
        private _seekDifference;
        private _currentTimeLiveResolvePromise;
        private _currentTimeLivePromise;
        private _baseThumbAssetUrl;
        private _thumbUrlLoaderResolvePromise;
        private _thumbUrlLoaderPromise;
        private _thumbUrlIsLoaderActive;
        private _thumbUrlAssetIdQueue;
        constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap);
        private _makeCurrentTimeLiveReadyPromise;
        private _makeThumbUrlLoaderResolvePromise;
        private _onTimedMetadataLoaded;
        private _onTimeUpdate;
        private _handleSeeking;
        private _addBindings;
        private _handleConnection;
        private _handleConnectionError;
        private _fixCuePointEndTime;
        private _makeCuePointStartEndTime;
        private _isCueInvalid;
        private _prepareThumbCuePoints;
        private _prepareViewChangeCuePoints;
        private _preparePublicQnaCuePoints;
        private _prepareUserQnaCuePoints;
        private _prepareCodeQnaCuePoints;
        private _getBaseThumbAssetUrl;
        private _handleThumbNotificationData;
        private _handleSlideViewChangeNotificationData;
        private _handlePublicQnaNotificationsData;
        private _handleUserQnaNotificationsData;
        private _handleCodeQnaNotificationsData;
        private _handlePushNotificationsErrorData;
        private _constructPushNotificationListener;
        private _removePushNotificationListener;
        destroy(): void;
    }
}
declare module "cuepoint-service" {
    import Player = KalturaPlayerTypes.Player;
    import { KalturaCuePointType, KalturaThumbCuePointSubType, CuePointTags } from "types";
    import EventManager = KalturaPlayerTypes.EventManager;
    export class CuepointService {
        private _types;
        private _provider;
        private _player;
        private _eventManager;
        private _logger;
        private _mediaLoaded;
        get CuepointType(): typeof KalturaCuePointType;
        get KalturaThumbCuePointSubType(): typeof KalturaThumbCuePointSubType;
        get KalturaCuePointType(): {
            [type: string]: string;
        };
        get KalturaCuePointTags(): typeof CuePointTags;
        get cuePointManager(): import("cuepoint-manager").CuePointManager | null;
        constructor(player: Player, eventManager: EventManager, logger: any);
        registerTypes(types: KalturaCuePointType[]): void;
        private _initProvider;
        reset(): void;
    }
}
declare module "cuepoints" {
    import Player = KalturaPlayerTypes.Player;
    export class Cuepoints extends KalturaPlayer.core.BasePlugin {
        private _cuePointService;
        /**
         * The default configuration of the plugin.
         * @static
         */
        static defaultConfig: {};
        constructor(name: string, player: Player);
        reset(): void;
        destroy(): void;
        /**
         * @static
         * @public
         * @returns {boolean} - Whether the plugin is valid.
         */
        static isValid(): boolean;
    }
}
declare module "index" {
    import { Cuepoints } from "cuepoints";
    const VERSION: string;
    const NAME: string;
    export { Cuepoints as Plugin };
    export { VERSION, NAME };
}
declare module "providers/live/index" {
    export * from "providers/live/live-provider";
}
