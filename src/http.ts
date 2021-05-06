import { createServer } from 'http';
import { URL } from 'url';
import { getVehicles, isLoggedIn, tryLogin } from './tesla';

interface SimpleResponse {
    body?: unknown;
    statusCode:  number;
}

function simpleError(statusCode: number, error: string) {
    return { statusCode, body: { error } };
}

function simpleBody(body: unknown) {
    return { statusCode: 200, body };
}

async function handleRequest(url: URL, method: string, bodyRaw: string): Promise<SimpleResponse> {
    let body = undefined;
    try {
        body = (bodyRaw.length > 0) ? JSON.parse(bodyRaw) : undefined;
    } catch {
        return simpleError(400, 'Invalid JSON body');
    }

    const routeName = `${method.toUpperCase()} ${url.pathname}`;
    if (routeName === 'POST /v1/login') {
        try {
            await tryLogin(body);
        } catch {
            return simpleError(400, 'Error logging into Tesla API');
        }
        return simpleBody('Logged into Tesla API');
    }

    if (!isLoggedIn()) {
        return simpleError(400, 'Not logged into Tesla API');
    }

    switch (routeName) {
        case 'GET /v1/vehicles':
            return simpleBody(getVehicles());
    }

    return simpleError(404, 'Route not found');
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
                res.writeHead(500);
                res.end();
                console.error(e);
            });
        });
    });

    server.listen(parseInt(process.env.PORT || '1337', 10));
}