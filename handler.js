'use strict';

const {
    authUser,
    authWebsocket,
    refreshToken
} = require('./src/controllers/auth.controller');

const {
    greeting
} = require('./src/controllers/greeting.controller');

const {
    defaultSocketHandler,
    handleSocketConnect,
    handleSocketDisconnect
} = require('./src/controllers/websocket.controller');

module.exports.authUser = authUser;
module.exports.authWebsocket = authWebsocket;
module.exports.defaultSocketHandler = defaultSocketHandler;
module.exports.greeting = greeting;
module.exports.handleSocketConnect = handleSocketConnect;
module.exports.handleSocketDisconnect = handleSocketDisconnect;
module.exports.refreshToken = refreshToken;
