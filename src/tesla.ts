import * as tjs from "teslajs";
import { writeFile, readFile } from "fs/promises";

interface TeslaJSTokenData {
    authToken: string;
    refreshToken: string;
}

let authData: TeslaJSTokenData | undefined;
let loginDone: boolean = false;
let vehicles: tjs.Vehicle[];

function addAuthToRequest(opt: Partial<tjs.optionsType> = {}): tjs.optionsType {
    opt.authToken = authData!.authToken;
    return opt as tjs.optionsType;
}

async function postLogin(body: unknown) {
    const expiresInSeconds = (body as any).expires_in as number;

    await saveAuthData();
    vehicles = Object.values(await tjs.vehiclesAsync(addAuthToRequest())) as tjs.Vehicle[];

    setTimeout(async () => {
        console.log('Refreshing Tesla API access token...');
        try {
            await tryReLogin();
        } catch (e) {
            console.error('Error refreshing Tesla API access token', e);
            return;
        }
        console.log('Successfully refreshed Tesla API access token.');
    }, (expiresInSeconds * 1000) / 2.0);
    
    loginDone = true;
}

export function getVehicles() {
    return vehicles;
}

async function saveAuthData() {
    if (!authData) {
        throw new Error("Cannot save empty auth");
    }
    authData = {
        authToken: authData.authToken,
        refreshToken: authData.refreshToken,
    };
    await writeFile("./config/auth-data.json", JSON.stringify(authData));
}

export async function tryReLogin() {
    authData = JSON.parse(await readFile("./config/auth-data.json", "utf8")) as TeslaJSTokenData;
    const refreshData = await tjs.refreshTokenAsync(authData.refreshToken);
    authData = refreshData;
    await postLogin(JSON.parse(refreshData.body as unknown as string));
}

export async function tryLogin(data: tjs.LoginOptions) {
    const loginData = await tjs.loginAsync(data);
    authData = loginData;
    await postLogin(loginData.body);
}

export async function runRequest(request: string, opts?: Partial<tjs.optionsType>) {
    return await (tjs as any)[`${request}Async`](addAuthToRequest(opts));
}

export function isLoggedIn() {
    return loginDone;
}
