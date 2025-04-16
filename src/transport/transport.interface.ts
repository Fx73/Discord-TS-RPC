import { GatewayMessage } from '../gateway/gateway-message';
import { IPCTransport } from "./ipc";
import { Subject } from "rxjs";
import { WebSocketTransport } from "./websocket";

export enum TransportState {
    OPEN = "open",
    READY = "ready",
    CLOSE = "close",
    ERROR = "error",
}

export interface ITransport {

    $tMessage: Subject<GatewayMessage>
    $tStatus: Subject<TransportState>
    isOpen: boolean;

    connect(): Promise<void>;
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