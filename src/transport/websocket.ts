import { ITransport } from './transport.interface';
import { Subject } from "rxjs";

export class WebSocketTransport implements ITransport {
    public static readonly OPEN_EVENT = 'open';
    public static readonly CLOSE_EVENT = 'close';
    public static readonly ERROR_EVENT = 'error';

    public isOpen = false;

    public $tMessage = new Subject<string>()
    public $tStatus = new Subject<string>()

    private clientId: any;
    private ws: WebSocket | null;
    private tries: number;


    constructor(clientId: string) {
        this.clientId = clientId;
        this.ws = null;
        this.tries = 0;
    }

    public connect() {
        const port = 6463 + (this.tries % 10);
        this.tries += 1;

        this.ws = new WebSocket(
            `ws://127.0.0.1:${port}/?v=1&client_id=${this.clientId}`
        );
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    }

    private onOpen() {
        this.$tStatus.next('open');
        this.isOpen = true;
    }

    private onClose(event: CloseEvent) {
        if (!event.wasClean) {
            return;
        }
        this.$tStatus.next('close');
    }

    private onError(event: Event) {
        this.$tStatus.next('error');
        if (this.tries > 20) {
            this.ws?.close();
        } else {
            try {
                this.ws?.close();
            } catch (err) { }

            this.connect();
        }
    }


    private onMessage(event: MessageEvent) {
        console.log("Received : ", event)
        this.$tMessage.next(JSON.parse(event.data));
    }

    public send(data: any) {
        console.log("Sending : ", data)
        this.ws?.send(JSON.stringify(data));
    }

    public ping() { }

    public close() {
        return new Promise((r) => {
            this.ws?.close();
        });
    }
}