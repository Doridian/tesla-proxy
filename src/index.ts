import * as tjs from 'teslajs';
import { writeFile, readFile } from 'fs/promises';

interface TeslaJSTokenData {
    authToken: string;
    refreshToken: string;
}

let authData: TeslaJSTokenData | undefined;

async function saveAuthData() {
    if (!authData) {
        return;
    }
    authData = {
        authToken: authData.authToken,
        refreshToken: authData.refreshToken,
    };
    await writeFile('../config/auth-data.json', JSON.stringify(authData));
}

async function tryReLogin() {
    authData = JSON.parse(await readFile('../config/auth-data.json', 'utf8')) as TeslaJSTokenData;
    authData = await tjs.refreshTokenAsync(authData.refreshToken);
    saveAuthData()
}

async function tryLogin(data: tjs.LoginOptions) {
    authData = await tjs.loginAsync(data);
}

async function main() {
    try {
        await tryReLogin();
    } catch(e) {
        console.error('Error on ReLogin', e);
    }
}

main().catch(e => console.error(e));
