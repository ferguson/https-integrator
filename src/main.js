import os from 'node:os';
import http from 'node:http';
import express from 'express';
import { HTTPSDirectorDevice, WebServer } from 'https-director-device';
import { HubUplinkClient } from 'https-reflector';
import { HTTPSIntegrator } from './API.js';
import parseArgs from './parseArgs.js';

const log = Object.assign({}, console);
log.debug = ()=>{};


const usage = `
  --server <url>        - https director server url (required)
  --port <port>         - override the default port (80 for http, 443 for https)
  --bind                - the ip address to bind to (default 0.0.0.0)
  --redirect-http       - redirect port 80 to port 443 (or --port)
  --redirect-port       - change port for redirector to listen on (default 80)
  --hub <url>           - https-reflector server url
  --devicename <name>   - unique device name to use (defaults to hostname)
`;

const defaults = {
    '--bind': '0.0.0.0',
    '--port': 80,
};

const environment = {
    '--server':           'HTTPS_DIRECTOR_SERVER_URL',
    '--hub':              'HTTPS_REFLECTOR_SERVER_URL',
    '--port':             'PORT',
    '--bind':             'HOST',
    '--use-https':        'HTTPS',
    '--redirect-http':    'HTTPS_DIRECTOR_SERVER_REDIRECT_HTTP',
    '--redirect-port':    'HTTPS_DIRECTOR_SERVER_REDIRECT_PORT',
    '--cert-chain-file':  'SSL_CERT_FILE',
    '--private-key-file': 'SSL_KEY_FILE',
};


export default async function main(argv) {
    let options = parseArgs(argv, usage, defaults, environment);
    log.log('options', options);

    let devicename = options.devicename || os.hostname().split('.')[0];
    log.log(`using device name ${devicename}`);

    let app = express();
    let webServer = new WebServer(options, app);
    let director = new HTTPSDirectorDevice(options, webServer);

    let httpsIntegrator = new HTTPSIntegrator(options);
    await httpsIntegrator.init(devicename);
    httpsIntegrator.addRoutes(app);

    let http_server = http.createServer();
    http_server.on('request', app);
    http_server.listen(80, '0.0.0.0', () => {
        log.log(`http server listening on 0.0.0.0:80`);
    });

    await director.init();
    log.log('https integrator ready');

    let uplink_client_options = {  // linking to myself! we can do better FIXME
        uplink_to_host: options.host,
        uplink_to_port: options.port,
    };
    let hubUplinkClient = new HubUplinkClient(options.hub, uplink_client_options);
    await hubUplinkClient.init(devicename);
    log.log('https-reflector client ready');

}
