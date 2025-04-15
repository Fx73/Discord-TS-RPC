import { Socket, createConnection } from 'net'

import { ITransport } from "./transport.interface";
import { Subject } from 'rxjs';

const OPCodes = {
    HANDSHAKE: 0,
    FRAME: 1,
    CLOSE: 2,
    PING: 3,
    PONG: 4,
};

export class IPCTransport implements ITransport {

    public $tMessage = new Subject<string>()
    public $tStatus = new Subject<string>()

    public isOpen: boolean = false;

    private client: any;
    private socket: Socket | null;
    private tries: number;

    constructor(client: any) {
        this.client = client;
        this.socket = null;
        this.tries = 0;
    }

    public connect() {
        function getIPCPath(id: number) {
            if (process.platform === 'win32') {
                return `\\\\?\\pipe\\discord-ipc-${id}`;
            }
            const { env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } } = process;
            const prefix = XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || '/tmp';
            return `${prefix.replace(/\/$/, '')}/discord-ipc-${id}`;
        }
        const path = getIPCPath(this.tries);
        this.tries++

        this.socket = createConnection(path, this.onOpen.bind(this));

        this.socket.on('close', this.onClose.bind(this));
        this.socket.on('error', this.onError.bind(this));

        this.socket.write(this.encode(OPCodes.HANDSHAKE, { v: 1, client_id: this.client.clientId }));
        this.socket.pause();

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
            this.socket?.end();
        } else {
            try {
                this.socket?.end();
            } catch (err) { }

            this.connect();
        }
    }


    private onMessage() {
        this.decode(this.socket!, ({ op, data }) => {
            switch (op) {
                case OPCodes.PING:
                    this.send(data, OPCodes.PONG);
                    break;
                case OPCodes.FRAME:
                    if (!data) return;
                    if (data.cmd === 'AUTHORIZE' && data.evt !== 'ERROR') {
                        this.findEndpoint()
                            .then((endpoint) => {
                                this.client.request.endpoint = endpoint;
                            })
                            .catch((e) => {
                                this.client.emit('error', e);
                            });
                    }
                    this.$tMessage.next(data);
                    break;
                case OPCodes.CLOSE:
                    this.$tStatus.next('close');
                    break;
                default:
                    break;
            }
        });
    }

    public send(data: any, op = OPCodes.FRAME) {
        this.socket?.write(this.encode(op, data));
    }


    async close() {
        return new Promise((r) => {
            this.send({}, OPCodes.CLOSE);
            this.socket?.end();
        });
    }

    ping() {
    }


    private encode(op: number, data: any) {
        data = JSON.stringify(data);
        const len = Buffer.byteLength(data);
        const packet = Buffer.alloc(8 + len);
        packet.writeInt32LE(op, 0);
        packet.writeInt32LE(len, 4);
        packet.write(data, 8, len);
        return packet;
    }



    private decode(socket: { read: () => any; }, callback: { ({ op, data }: { op: any; data: any; }): void; (arg0: { op: undefined; data: any; }): void; }) {
        const working = {
            full: '',
            op: undefined,
        };

        const packet = socket.read();
        if (!packet) {
            return;
        }

        let { op } = working;
        let raw;
        if (working.full === '') {
            op = working.op = packet.readInt32LE(0);
            const len = packet.readInt32LE(4);
            raw = packet.slice(8, len + 8);
        } else {
            raw = packet.toString();
        }

        try {
            const data = JSON.parse(working.full + raw);
            callback({ op, data });
            working.full = '';
            working.op = undefined;
        } catch (err) {
            working.full += raw;
        }

        this.decode(socket, callback);
    }

    private async findEndpoint(tries = 0): Promise<string> {
        if (tries > 30) {
            throw new Error('Could not find endpoint');
        }
        const endpoint = `http://127.0.0.1:${6463 + (tries % 10)}`;
        try {
            const r = await fetch(endpoint);
            if (r.status === 404) {
                return endpoint;
            }
            return this.findEndpoint(tries + 1);
        } catch (e) {
            return this.findEndpoint(tries + 1);
        }
    }

}