import { ITransport, TransportState } from './transport.interface';

import { GatewayMessage } from '../gateway/gateway-message';
import { Subject } from "rxjs";

export class WebSocketTransport implements ITransport {
    public static readonly OPEN_EVENT = 'open';
    public static readonly CLOSE_EVENT = 'close';
    public static readonly ERROR_EVENT = 'error';

    public isOpen: boolean = false;
    private isLocal: boolean = true;

    public $tMessage = new Subject<GatewayMessage>()
    public $tStatus = new Subject<TransportState>()

    private clientId: any;
    private ws: WebSocket | null;
    private lastSequence?: number;



    constructor(clientId: string, isLocal: boolean = false) {
        this.clientId = clientId;
        this.ws = null;
        this.isLocal = isLocal;
    }

    //#region Connect
    public async connect(): Promise<void> {
        if (this.isLocal) {
            const port = 6969;
            this.ws = new WebSocket(`ws://localhost:${port}/?v=10&encoding=json`); // &client_id=${this.clientId}
        } else {
            const response = await fetch("https://discord.com/api/v10/gateway");
            const data = await response.json();
            if (!data.url) throw new Error("RPC_GATEWAY_UNAVAILABLE");

            this.ws = new WebSocket(data.url + `?v=10&encoding=json`);
        }

        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    }


    public close() {
        return new Promise((r) => {
            this.ws?.close();
        });
    }
    //#endregion

    //#region Heartbeat
    private heartbeatTimer?: NodeJS.Timeout;
    private heartbeatInterval?: number;
    private lastHeartbeatACK: number;

    private initHeartbeat() {
        const jitter = Math.random();
        setTimeout(() => {
            this.sendHeartbeat();
            this.heartbeatTimer = setInterval(this.sendHeartbeat, this.heartbeatInterval);
        }, this.heartbeatInterval * jitter);
        this.$tStatus.next(TransportState.READY);
    }

    private sendHeartbeat() {
        console.log("💓 Sending Heartbeat...");

        if (Date.now() - this.lastHeartbeatACK > this.heartbeatInterval * 2) {
            console.warn("⚠️ Missing Heartbeat ACK reçu ! Reconnect...");
            this.ws.close(4000);
            clearInterval(this.heartbeatTimer);
            this.connect();
        }

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const payload = JSON.stringify({ op: 1, d: this.lastSequence ?? null });
        this.ws.send(payload);
        console.log("💓 Heartbeat sent :", payload);
    }

    //#endregion

    //#region Callbacks
    private onOpen() {
        this.$tStatus.next(TransportState.OPEN);
        this.isOpen = true;
    }

    private onClose(event: CloseEvent) {
        console.error("WebSocket close:", event);
        if (!event.wasClean) {
            return;
        }
        this.$tStatus.next(TransportState.CLOSE);
    }

    private onError(event: Event) {
        console.error("WebSocket error:", event);
        this.$tStatus.next(TransportState.ERROR);
        if (this.ws.readyState !== WebSocket.OPEN) {
            try {
                this.ws?.close();
            } catch (err) { }

            this.connect();
        }
    }

    private onMessage(event: MessageEvent) {
        console.log("📨 Received :", event.data);

        const payload = JSON.parse(event.data);

        if (payload.op === 1) { // Heartbeat request
            this.sendHeartbeat();
            return;
        }

        if (payload.op === 10) { // Hello
            this.heartbeatInterval = payload.d.heartbeat_interval;
            console.log("✅ Gateway handshake received ! Will send heartbeat every", payload.d.heartbeat_interval, "ms");
            this.sendHeartbeat();
            this.initHeartbeat();
            return;
        }

        if (payload.op === 11) { // Heartbeat ACK
            this.lastHeartbeatACK = Date.now();
            return;
        }

        const message = new GatewayMessage(payload);
        this.lastSequence = message.sequence ?? this.lastSequence;
        this.$tMessage.next(message);
    }

    //#endregion

    //#region Message
    public send(data: any) {
        console.log("SENDING : ", JSON.stringify(data, null, 2));
        this.ws?.send(JSON.stringify(data));
    }

    //#endregion


}