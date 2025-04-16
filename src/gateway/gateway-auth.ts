import { ITransport } from "transport/transport.interface";

export class DiscordGatewayAuth {
    API_ENDPOINT = 'https://discord.com/api/v10'

    clientId: string;
    clientSecret: string;

    redirectUri: string;
    scopes: string[];


    accessToken?: string;
    rpcToken?: string;
    prompt?: string;

    constructor(clientId: string, clientSecret: string, redirectUri?: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.scopes = DiscordGatewayAuth.getDefaultScopes();
        this.redirectUri = redirectUri ?? DiscordGatewayAuth.getDefaulRedirectUri();
    }


    private getAuthCode(): string {
        const state = Math.random().toString(36).substring(2, 15);
        const authUrl = new URL(`${this.API_ENDPOINT}/oauth2/authorize`);
        authUrl.searchParams.set("client_id", this.clientId);
        authUrl.searchParams.set("redirect_uri", this.redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", this.scopes.join(" "));
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("prompt", this.prompt ?? "consent");
        authUrl.searchParams.set("code_challenge_method", "S256");

        return authUrl.toString();
    }


    public async requestAccessToken() {
        const code = 'NeedCode' // TODO

        const body = new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            client_secret: this.clientSecret
        });

        const response = await fetch(`${this.API_ENDPOINT}/oauth2/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body
        });

        const data = await response.json();

        if (!data.access_token) {
            throw new Error("🚨 Auth failed");
        }

        this.accessToken = data.access_token;
        console.log("🔑 Access Token obtenu :", data);
    }


    private static getDefaultScopes() {
        return [
            'activities.read',
            'activities.write',
            'rpc',
            'rpc.activities.write'
        ];
    }
    private static getDefaulRedirectUri() {
        return 'http://127.0.0.1/callback'
    }
}