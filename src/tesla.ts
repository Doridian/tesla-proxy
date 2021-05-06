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

async function postLogin() {
    await saveAuthData();
    vehicles = Object.values(await tjs.vehiclesAsync(addAuthToRequest())) as tjs.Vehicle[];
    loginDone = true;
    console.log(vehicles);
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
    await writeFile("../config/auth-data.json", JSON.stringify(authData));
}

export async function tryReLogin() {
    authData = JSON.parse(await readFile("../config/auth-data.json", "utf8")) as TeslaJSTokenData;
    authData = await tjs.refreshTokenAsync(authData.refreshToken);
    await postLogin();
}

export async function tryLogin(data: tjs.LoginOptions) {
    authData = await tjs.loginAsync(data);
    await postLogin();
}

export async function runRequest(request: string, opts?: Partial<tjs.optionsType>) {
    return await (tjs as any)[`${request}Async`](addAuthToRequest(opts));
}

export function isLoggedIn() {
    return loginDone;
}
