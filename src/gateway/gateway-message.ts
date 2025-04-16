export class GatewayMessage {
    public opcode: number;
    public data: any;
    public sequence: number | null;
    public eventName: string | null;

    constructor(payload: any) {
        this.opcode = payload.op ?? -1; // Gateway opcode, which indicates the payload type
        this.data = payload.d ?? null;  // Event data
        this.sequence = payload.s ?? null;  // Sequence number of event used for resuming sessions and heartbeating
        this.eventName = payload.t ?? null; // Event name
    }
    public logMessage() {
        console.log(`📩 [Gateway Message] Op: ${this.opcode}, Event: ${this.eventName}, Seq: ${this.sequence}`);
        console.log("📜 Data:", this.data);
    }
}
