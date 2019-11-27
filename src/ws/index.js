'use strict';

const WebSocket = require('./websocket');

WebSocket.createWebSocketStream = require('./stream');
WebSocket.Server = require('./websocket-server');
WebSocket.Receiver = require('./receiver');
WebSocket.Sender = require('./sender');

module.exports = WebSocket;
