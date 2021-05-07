import * as tjs from "teslajs";
import { createServer } from 'http';
import { URL } from 'url';
import { addAuthToRequest, getVehicles, isLoggedIn, tryLogin } from './tesla';

interface SimpleResponse {
    body?: unknown;
    statusCode:  number;
}

class HTTPError extends Error {
    constructor(public code: number, public error: string) {
        super();
    }
}

function simpleBody(body: unknown) {
    return { statusCode: 200, body };
}

function requireLogin() {
    if (!isLoggedIn()) {
        throw new HTTPError(400, 'Not logged into Tesla API');
    }
}

/*
function requireMethods(method: string, neededMethods: Set<string>) {
    if (!neededMethods.has(method)) {
        throw new HTTPError(405, `Invalid method, needs one of: ${[...neededMethods].join(', ')}`);
    }
}
*/

function requireMethod(method: string, neededMethod: string) {
    if (neededMethod !== method) {
        throw new HTTPError(405, `Invalid method, needs: ${neededMethod}`);
    }
}

async function handleRequest(url: URL, method: string, bodyRaw: string): Promise<SimpleResponse> {
    let body = undefined;
    try {
        body = (bodyRaw.length > 0) ? JSON.parse(bodyRaw) : undefined;
    } catch {
        throw new HTTPError(400, 'Invalid JSON in body');
    }

    method = method.toUpperCase();
    const routeSplit = url.pathname.substr(1).split('/');
    if (routeSplit[0] !== 'v1') {
        throw new HTTPError(404, 'Invalid API version, supported: v1');
    }

    switch (routeSplit[1]) {
        case 'login':
            requireMethod(method, 'POST');
            try {
                await tryLogin(body);
            } catch (e) {
                console.error('Error logging into Tesla API', e);
                throw new HTTPError(400, 'Error logging into Tesla API');
            }
            return simpleBody('Logged into Tesla API');

        case 'vehicle':
            requireLogin();
    
            if (!routeSplit[2]) {
                requireMethod(method, 'GET');
                return simpleBody(getVehicles());
            }

            if (!routeSplit[3]) {
                requireMethod(method, 'GET');
                return simpleBody({});
            }

            const vehicleID = routeSplit[2];
            const baseRequestData = addAuthToRequest({ vehicleID });

            switch (routeSplit[3]) {
                case 'climate':
                    if (!routeSplit[4]) {
                        requireMethod(method, 'GET');
                        return simpleBody(await tjs.climateStateAsync(baseRequestData)); 
                    }

                    requireMethod(method, 'POST');
                    switch (routeSplit[4]) {
                        case 'on':
                        case 'start':
                            return simpleBody(await tjs.climateStartAsync(baseRequestData));
                        case 'off':
                        case 'stop':
                            return simpleBody(await tjs.climateStopAsync(baseRequestData));
                    }
            }
            break;
    }

    
    throw new HTTPError(404, 'Route not found');
}

export function startHTTP() {
    const server = createServer((req, res) => {
        const url = new URL(`http://dummyhost${req.url}`);
        let data = '';
    
        req.on('data', (d) => {
            data += d;
        });
        req.on('end', () => {
            handleRequest(url, req.method!, data)
            .then((simpleRes) => {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(simpleRes.statusCode);
                if (simpleRes.body) {
                    res.write(JSON.stringify(simpleRes.body));
                }
                res.end();
            }, (e) => {
                if (e instanceof HTTPError) {
                    res.writeHead(e.code);
                    res.write(JSON.stringify({ error: e.error }));
                    res.end();
                    return;
                }
                res.writeHead(500);
                res.end();
                console.error(e);
            });
        });
    });

    server.listen(parseInt(process.env.PORT || '1337', 10));
}