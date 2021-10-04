import * as io from 'socket.io-client';
import Socket = SocketIOClient.Socket;
import {Utils} from './utils';

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
  public static CONNECTION_TIMEOUT: number = 10 * 60 * 1000;

  private _socket: Socket | any;
  private _listenKeys: Record<string, ListenKeysObject> = {};
  private _messageKeyToQueueKeyMap: Record<string, string> = {};
  private _connected = false;

  constructor(socketWrapperParams: SocketWrapperParams, private _logger: KalturaPlayerTypes.Logger) {
    this._logger.info(`Connecting to socket`);
    this._connectAndListenToSocket(socketWrapperParams);
  }

  public destroy() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }

    this._listenKeys = {};
    this._messageKeyToQueueKeyMap = {};
    this._connected = false;
  }

  private _connectAndListenToSocket(socketWrapperParams: SocketWrapperParams) {
    this._logger.info('connect to socket');
    this._socket = io(socketWrapperParams.url, {
      forceNew: true,
      timeout: SocketWrapper.CONNECTION_TIMEOUT
    });

    this._socket.on('validated', () => {
      this._connected = true;

      for (const key in this._listenKeys) {
        this._logger.info('Emit listen to url');
        this._socket.emit('listen', this._listenKeys[key].queueNameHash, this._listenKeys[key].queueKeyHash);
      }
    });

    this._socket.on('connected', (messageKey: string, queueKey: string) => {
      if (this._listenKeys[queueKey]) {
        this._messageKeyToQueueKeyMap[messageKey] = queueKey;
        this._logger.info('Listening to queue');
      } else {
        this._logger.error('Cannot listen to queue, queueKeyHash not recognized');
      }
    });

    this._socket.on('message', (messageKey: string, msg: any) => {
      this._logger.debug('Cannot listen to queue, queueKeyHash not recognized');
      if (this._messageKeyToQueueKeyMap[messageKey] && this._listenKeys[this._messageKeyToQueueKeyMap[messageKey]]) {
        this._listenKeys[this._messageKeyToQueueKeyMap[messageKey]].onMessage.forEach(cb => {
          cb(msg);
        });
      } else {
        this._logger.error(`couldn't find queueKey in map`);
      }
    });

    this._socket.on('disconnect', (e: any) => {
      this._logger.info('push server was disconnected');
      if (!Utils.isEmptyObject(this._listenKeys)) {
        const onSocketDisconnect = socketWrapperParams.onSocketDisconnect;
        if (onSocketDisconnect) onSocketDisconnect(e);
      }
    });

    this._socket.on('reconnect', (e: any) => {
      this._logger.info('push server was reconnected');
      if (!Utils.isEmptyObject(this._listenKeys)) {
        const onSocketReconnect = socketWrapperParams.onSocketReconnect;
        if (onSocketReconnect) onSocketReconnect(e);
      }
    });

    this._socket.on('reconnect_error', (e: any) => {
      this._logger.error('reconnection error');
    });

    this._socket.on('errorMsg', (msg: any) => {
      this._logger.error('error message recieved');
    });
  }

  public prepareForListening(eventName: string, queueNameHash: string, queueKeyHash: string, onMessage: Function) {
    if (this._listenKeys[queueKeyHash]) {
      this._listenKeys[queueKeyHash].onMessage.push(onMessage);
    } else {
      this._listenKeys[queueKeyHash] = {
        eventName: eventName,
        queueNameHash: queueNameHash,
        queueKeyHash: queueKeyHash,
        onMessage: [onMessage]
      };
    }
    if (this._connected) {
      this._logger.info(`Listening to ${eventName}`);
      this._socket.emit('listen', queueNameHash, queueKeyHash);
    }
  }
}
