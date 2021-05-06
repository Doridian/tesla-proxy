import { createServer } from 'http';
import { URL } from 'url';

interface SimpleResponse {
    body?: unknown;
    statusCode:  number;
}

function simpleError(statusCode: number, error: string) {
    return { statusCode, body: { error } };
}

async function handleRequest(url: URL, method: string, bodyRaw: string): Promise<SimpleResponse> {
    let body = undefined;
    try {
        body = (bodyRaw.length > 0) ? JSON.parse(bodyRaw) : undefined;
    } catch {
        return simpleError(400, 'Invalid JSON body');
    }

    const routeName = `${method.toUpperCase()} ${url.pathname}`;

    switch (routeName) {
        case 'POST /v1/login':
            break;
    }

    return simpleError(404, 'Route not found');
}

const server = createServer((req, res) => {
    const url = new URL(req.url!);
    let data = '';

    req.on('data', (d) => {
        data += d;
    });
    req.on('end', () => {
        handleRequest(url, req.method!, data)
        .then((simpleRes) => {
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
