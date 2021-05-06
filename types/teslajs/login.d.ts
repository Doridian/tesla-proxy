import 'telsajs';

declare module 'teslajs' {
    interface LoginOptions {
        username: string;
        password: string;
        mfaPassCode?: string;
    }

    function loginAsync(options: LoginOptions): Promise<TokenResponse>;
}
