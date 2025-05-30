import os from 'node:os';
import http from 'node:http';
import express from 'express';
import { HTTPSDirectorDevice, WebServer } from '../https-director/device/src/API.js';
import { HubUplinkClient } from '../https-reflector/API.mjs';
import { HTTPSIntegrator, getLocalIPAddress } from './API.js';
import parseArgs from './parseArgs.js';

const log = { ...console };
log.debug = ()=>{};


const usage = `
  --server <url>        - https-director server url (required)
  --reflector <url>     - https-reflector server url
  --devicename <name>   - unique device name to use (defaults to hostname)
  --port <port>         - override the default port (443)
  --bind                - the ip address to bind to (default 0.0.0.0)
`;

const defaults = {
    '--bind': '0.0.0.0',
    '--port': 443,
};

const environment = {
    '--server':           'HTTPS_DIRECTOR_SERVER_URL',
    '--reflector':        'HTTPS_REFLECTOR_SERVER_URL',
    '--port':             'PORT',
    '--bind':             'HOST',
};


export default async function main(argv) {
    let options = parseArgs(argv, usage, defaults, environment);
    log.log('options', options);

    let devicename = options.devicename || os.hostname().split('.')[0];
    log.log(`using device name ${devicename}`);

    let app = express();
    let director_options = { ...options, nostatic: true };
    let webServer = new WebServer(director_options, app);
    let director = new HTTPSDirectorDevice(options, webServer);

    let httpsIntegrator = new HTTPSIntegrator(options);
    await httpsIntegrator.init(devicename);
    httpsIntegrator.addRoutes(app);

    // we fire up the integrator proxy on port 80, the reflector client uses it
    // but we could make the reflector client go directly to the proxied services FIXME
    let http_server = http.createServer();
    http_server.on('request', app);
    http_server.listen(80, '0.0.0.0', () => {
        log.log(`http server listening on 0.0.0.0:80`);
    });

    await director.init();
    log.log('https integrator ready');

    // now setup the reflector connection
    let our_ip_address = getLocalIPAddress();
    let uplink_client_options = {  // linking to myself! we can do better FIXME
        uplink_to_host: our_ip_address,
        uplink_to_port: 80,
    };
    let hubUplinkClient = new HubUplinkClient(options.reflector, uplink_client_options);
    await hubUplinkClient.init(devicename);
    log.log('https-reflector client ready');
}
