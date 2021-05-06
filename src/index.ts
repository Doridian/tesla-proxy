import { startHTTP } from "./http";
import { tryReLogin } from "./tesla";

async function main() {
    try {
        await tryReLogin();
    } catch(e) {
        console.error("Error on ReLogin", e);
    }
    startHTTP();
}

main().catch(e => console.error(e));
