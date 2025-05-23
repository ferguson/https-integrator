import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import url from 'node:url';
import path from 'node:path';
import express from 'express';
import bodyParser from 'body-parser';
//import asyncHandler from 'express-async-handler';

import { HTTPSIntegratorServer } from './API.js';

const log = Object.assign({}, console);
//log.debug = ()=>{};

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const STATIC_DIR = process.env.HTTPS_REFLECTOR_PUBLIC_STATIC_DIR || __dirname + '/../static';

//const DEFAULT_CERTIFICATE_DIR  = '/etc/letsencrypt/live/some-https-reflector-server.org';
//     //private_key_file: DEFAULT_CERTIFICATE_DIR + '/privkey.pem',
//     //certificate_file: DEFAULT_CERTIFICATE_DIR + '/cert.pem',
//     //authority_file:   DEFAULT_CERTIFICATE_DIR + '/chain.pem',


export default class WebServer {
    constructor(options) {
        this.options = Object.assign({}, options);
    }


    async init() {
        let web_server;
        let web_server_options = {
            keepAlive: true
        };
        let use_port;

        if (!this.options.use_https) {
            web_server = http.createServer(web_server_options);
            use_port = this.options.port || this.options.port;
        } else {
            // const privateKey = fs.readFileSync(this.options.private_key_file);
            // const certificate = fs.readFileSync(this.options.certificate_file);
            // const certAuthority = fs.readFileSync(this.options.authority_file);
            // const credentials = {
            //     key: privateKey,
            //     cert: certificate,
            //     ca: certAuthority
            // };
            // web_server_options = Object.assign(web_server_options, credentials);
            // web_server = https.createServer(web_server_options);
            // use_port = this.options.port || this.options.https_port;
        }

        this.app = express();

        this.httpsIntegratorServer = new HTTPSIntegratorServer(this.options);
        await this.httpsIntegratorServer.init();
        this.httpsIntegratorServer.addRoutes(this.app);

        this.addRoutes(this.app);
	web_server.on('request', this.app);
        web_server.listen(use_port, this.options.bind, async () => {
            log.log(`server listening on ${this.options.bind}:${use_port}`);
            // if (this.options.use_https && this.options.redirect_http) {
            //     this.initHTTPRedirector();
            // }
        });
    }


    addRoutes(app) {
        //app.use(express.static(STATIC_DIR));
        app.get('/', (req, res) => {
            log.log('hello!');
            res.end('hello!');
        });
    }
}
