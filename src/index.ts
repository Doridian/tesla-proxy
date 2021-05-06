import * as tjs from 'teslajs';

// const [,username, password, mfa] = process.argv;
const authData = require('../config/auth-data.json');


async function main() {
    await tjs.loginAsync({
        username,
        password,
        mfaPassCode: mfa,
    });
}

main().catch(e => console.error(e));
