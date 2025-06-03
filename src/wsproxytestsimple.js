import http from 'node:http';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const backend_ip_address = '10.99.0.44';

main();
async function main() {
    let app = express();

    let http_server = http.createServer();
    http_server.on('request', app);
    http_server.listen(80, '0.0.0.0', async () => {
        console.log('server listening on 0.0.0.0:80');
    });

    app.use((req, res, next) => {
        console.log('req.path', req.path);
        next();
    });

    useProxy(app, http_server, '/api/v1/command',    `ws://${backend_ip_address}:8765`);
    useProxy(app, http_server, '/api/v1/video/',     `ws://${backend_ip_address}:8001`);

    console.log('http wsproxytest ready');
}


function useProxy(app, server, path, target) {
    let options = {
	target: target,
	changeOrigin: true,
	ws: true,
	secure: false,
	agent: false,
	headers: { connection: 'close' },
	on: {
	    error: (err, req, res) => {
                console.error('proxy error handler', err);
	    }
	},
    };
    let proxy = createProxyMiddleware(options);

    app.use(path, proxy);
    server.on('upgrade', (req, socket, head) => {
	console.log('upgrade event', req.url);
	if (req.url.startsWith(path)) {
	    console.log(0, req.url);
	    console.log('req.headers', req.headers);
	    proxy.upgrade(req, socket, head);
	}
    });
}
