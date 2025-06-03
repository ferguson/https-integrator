import fs from 'node:fs';
import os from 'node:os';
//import https from 'node:https';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
//import compression from 'compression';
//import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';

const log = { ...console };
log.debug = ()=>{};


main();
async function main(argv) {
    let app = express();

    //let cookie_parser = cookieParser();

    app.use(cors({origin: '*'}));
    app.use(bodyParser.json());
    //app.use(cookie_parser);
    //app.use(compression()); // wondering how much this helps, esp. locally

    //this.addRoutes(app);

    // let https_server = https.createServer({
    //     cert: fs.readFileSync('/home/rpi/https-integrator/fullchain.pem'),
    //     key: fs.readFileSync('/home/rpi/https-integrator/privkey.pem'),
    //     //SNICallback: this.handleSNICallback.bind(this)
    // });

    // https_server.on('request', app);

    // https_server.listen(443, '0.0.0.0', async () => {
    //     log.log('server listening on 0.0.0.0:443');
    // });

    let http_server = http.createServer();

    http_server.on('request', app);

    http_server.listen(80, '0.0.0.0', async () => {
        log.log('server listening on 0.0.0.0:80');
    });

    app.use((req, res, next) => {
        console.log('req.path', req.path);
        next();
    });

    let ip_address = getLocalIPAddress();
    log.log('ip_address', ip_address);

    //let path = '/api/v1/command';
    //let target = `ws://${ip_address}:8765`;
    //let proxy = createProxy(path, target);
    //app.use(path, proxy);

    // https_server.on('upgrade', (req, socket, head) => {
    // 	if (req.url.startsWith(path)) {
    // 	    log.log(0, req.url);
    // 	    //log.log(req);
    // 	    proxy.upgrade(req, socket, head);
    // 	}
    // });

    useProxy(app, http_server, '/api/v1/command',    `ws://${ip_address}:8765`);
    useProxy(app, http_server, '/api/v1/video/',     `ws://${ip_address}:8001`);
    //useProxy(app, http_server, '/api/v1/videopush',  `ws://${ip_address}:8000`);
    //useProxy(app, http_server, '/api/v1/microphone', `ws://${ip_address}:8771`);
    //useProxy(app, http_server, '/api/v1/speaker',    `ws://${ip_address}:8877`);
    //useProxy(app, http_server, '/api/v1/upload',     `ws://${ip_address}:8080`);

    //app.use('/', this.static_server);

    log.log('http wsproxytest ready');
}


function useProxy(app, servers, path, target) {
    servers = Array.isArray(servers) ? servers : [servers];
    let proxy = createProxy(path, target);
    app.use(path, proxy);
    let i = 0;
    for (let server of servers) {
	let n = 1;
	n++;
	server.on('upgrade', (req, socket, head) => {
	    log.log('upgrade event', req.url);
	    if (req.url.startsWith(path)) {
		log.log(n, req.url);
		log.log('req.headers', req.headers);
		proxy.upgrade(req, socket, head);
	    }
	});
    }
}


function createProxy(path, target) {
    let path_regexp = `^${path}`;
    let pathRewrite = {};
    pathRewrite[path_regexp] = '';
    let options = {
	target: target,
	changeOrigin: true,
	//pathRewrite,
	ws: true,
	secure: false,
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

    let proxy = createProxyMiddleware(options);
    return proxy;
}


function getLocalIPAddress() {
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
