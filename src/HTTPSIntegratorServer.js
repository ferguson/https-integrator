import http from 'http';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
//import { freeParser } from '_http_common';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import asyncHandler from 'express-async-handler';
//import WebSocketStream from 'websocket-stream';
import { WebSocketServer, createWebSocketStream } from 'ws';
import { Server as SocketIOServer } from 'socket.io';

const log = Object.assign({}, console);
log.debug = ()=>{};

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = __dirname + '/../../static';


export default class HTTPSIntegratorServer {
    constructor(options) {
        this.options = options;
    }


    async init() {
        this.static_server = express.static(STATIC_DIR);
    }


    addRoutes(app) {
        // I believe the ports in use are:
        // - 8000: video
        // - 8080: image and sound file server
        // - 8771: bot audio to computer
        // - 8877: computer audio to bot
        // - 8765: RPI commands (e.g., display and sound commands)

        app.use(
            '/api/v1/command',
            createProxyMiddleware({ target: 'http://localhost:8765' })
        );
        app.use(
            '/api/v1/video',
            createProxyMiddleware({ target: 'http://localhost:8001' })
        );
        app.use(
            '/api/v1/videopush',
            createProxyMiddleware({ target: 'http://localhost:8000' })
        );
        app.use(
            '/api/v1/microphone',
            createProxyMiddleware({ target: 'http://localhost:8771' })
        );
        app.use(
            '/api/v1/speaker',
            createProxyMiddleware({ target: 'http://localhost:8877' })
        );
    }
}
