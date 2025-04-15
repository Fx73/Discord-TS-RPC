import { IPCTransport } from "./ipc";
import { Subject } from "rxjs";
import { WebSocketTransport } from "./websocket";

export interface ITransport {
    $tMessage: Subject<string>
    $tStatus: Subject<string>
    isOpen: boolean;

    connect(): void;
    send(data: any): void;
    close(): void;
}



export class TransportFactory {
    public static createTransport(type: string, clientId: string): ITransport {
        if (type === 'ipc') {
            throw new TypeError('NOT AVAILABLE IN BROWSER');
            //return new IPCTransport(clientId);
        }
        if (type === 'websocket') {
            return new WebSocketTransport(clientId);
        }

        throw new TypeError('RPC_INVALID_TRANSPORT');

    }
}