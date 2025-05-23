import { WebServer } from './API.js';
import parseArgs from './parseArgs.js';

const log = Object.assign({}, console);
log.debug = ()=>{};


const usage = `
  --port <port>            - override the default port (80 for http, 443 for https)
  --bind                   - the ip address to bind to (default 0.0.0.0)
`;

const environment = {
    '--port':             'PORT',
    '--bind':             'HOST',
};

const defaults = {
    '--bind': '0.0.0.0',
    '--port': 80,
};


export default async function main(argv) {
    let options = parseArgs(argv, usage, defaults, environment);
    log.debug('options', options);
    let server = new WebServer(options);
    await server.init();
    log.debug('https-integrator server ready');
}
