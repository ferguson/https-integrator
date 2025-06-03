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


    addProxies(app, servers) {
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

	this.useWSProxy(app, servers, '/api/v1/command',    `ws://${ip_address}:8765`);
        this.useProxy(app, servers, '/api/v1/video',      `http://${ip_address}:8001`);
        //this.useProxy(app, servers, '/api/v1/videopush',  `http://${ip_address}:8000`);
        this.useWSProxy(app, servers, '/api/v1/microphone', `http://${ip_address}:8771`);
        this.useWSProxy(app, servers, '/api/v1/speaker',    `http://${ip_address}:8877`);
        this.useProxy(app, servers, '/api/v1/upload',     `http://${ip_address}:8080`);
    }
	

    addRoutes(app) {
        app.use('/', this.static_server);
    }


    useWSProxy(app, servers, path, target) {
	return this.useProxy(app, servers, path, target, true);
    }
    useProxy(app, servers, path, target, wsonly=false) {
	servers = Array.isArray(servers) ? servers : [servers];
	let proxy = this.createProxy(path, target, wsonly);
        app.use(path, proxy);
	if (wsonly) {
	    let i = 0;
	    for (let server of servers) {
		let n = 1;
		n++;
		server.on('upgrade', (req, socket, head) => {
		    if (req.url.startsWith(path)) {
			log.log(n, req.url);
			log.log('req.headers', req.headers);
			proxy.upgrade(req, socket, head);
		    }
		});
	    }
	}
    }


    createProxy(path, target, wsonly=false) {
	let path_regexp = `^${path}`;
	let pathRewrite = {};
	pathRewrite[path_regexp] = '';
	let options = {
	    target: target,
	    changeOrigin: true,
	    pathRewrite,
	    //ws: true,
	    secure: false,
  	    agent: false,
	    logLevel: 'debug',
	    on: {
		proxyReq: (proxyReq, req, res) => {
                    //delete proxyReq.headers['keep-alive'];
                    //console.log(proxyReq);
		},
		error: (err, req, res) => {
                    //console.log('error handler', req);
                    //console.log('error handler', res);
                    console.error('error handler', err);
		}
	    },
        };
	if (!wsonly) {
	    options.headers = { connection: 'close' };
	}
        let proxy = createProxyMiddleware(options);

        // let debug = (...args) => {
        //     let req = args[0];
        //     console.log('debug', req.path);
        //     proxy(...args);
        // };
        // return debug;
        return proxy;
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
