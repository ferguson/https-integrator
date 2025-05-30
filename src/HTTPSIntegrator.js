import os from 'node:os';
import url from 'node:url';
import path from 'node:path';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
//import asyncHandler from 'express-async-handler';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const STATIC_DIR = path.normalize(path.join(__dirname, '..', 'static'));

const log = { ...console };
log.debug = ()=>{};


export default class HTTPSIntegrator {
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
        // we should make this a config file FIXME

        // some (all?) of the python servers bind to the external IP address
        // so use that instead of 'localhost'
        let ip_address = getLocalIPAddress();

        app.use((req, res, next) => {
            console.log('HTTPSIntegrator req.path', req.path);
            next();
        });

        app.use(
            '/api/v1/command',
            this.createProxyMiddleware({ target: `http://${ip_address}:8765` })
        );
        app.use(
            '/api/v1/video',
            this.createProxyMiddleware({ target: `http://${ip_address}:8001` })
        );
        app.use(
            '/api/v1/videopush',
            this.createProxyMiddleware({ target: `http://${ip_address}:8000` })
        );
        app.use(
            '/api/v1/microphone',
            this.createProxyMiddleware({ target: `http://${ip_address}:8771` })
        );
        app.use(
            '/api/v1/speaker',
            this.createProxyMiddleware({ target: `http://${ip_address}:8877` })
        );
        app.use(
            '/api/v1/upload',
            this.createProxyMiddleware({ target: `http://${ip_address}:8080` })
        );

        app.use('/', this.static_server);
    }


    createProxyMiddleware(options) {
        let on = {
            //proxyReq: (proxyReq, req, res) => {
                //delete proxyReq.headers['keep-alive'];
                //console.log(proxyReq);
            //},
            error: (err, req, res) => {
                //console.log('error handler', req);
                //console.log('error handler', res);
                console.error('error handler', err);
            },
        };
        options.on = on;
        options.ws = true;
        let proxyMiddleware = createProxyMiddleware(options);

        //let debug = (...args) => {
        //    //let req = args[0];
        //    //console.log('debug', req.path);
        //    proxyMiddleware(...args);
        //};
        //return debug;
        return proxyMiddleware;
    }
}


export function getLocalIPAddress() {
    let network_interfaces = os.networkInterfaces();
    let platform = os.platform();
    let ip_address;

    switch (platform) {
    case 'linux':
        let wlan0 = network_interfaces['wlan0'];
        for (let address of wlan0) {
            if (address?.family === 'IPv4') {
                ip_address = address.address;
                break;
            }
        }
        break;

    case 'darwin':
        let en0 = network_interfaces['en0'];
        for (let address of en0) {
            if (address?.family === 'IPv4') {
                ip_address = address.address;
                break;
            }
        }
        break;

    default:
        throw new Error(`do not know how to handle platfom ${platform}`);
    }

    return ip_address;
}
