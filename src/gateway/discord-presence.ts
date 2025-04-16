export enum PresenceStatus {
    ONLINE = "online",
    DND = "dnd",
    IDLE = "idle",
    INVISIBLE = "invisible",
    OFFLINE = "offline"
}

export class DiscordPresence {
    public since: number | null;
    public activities: DiscordActivity[];
    public status: PresenceStatus;
    public afk: boolean;

    constructor(activities: DiscordActivity[], status: PresenceStatus = PresenceStatus.ONLINE, since: number | null = null, afk: boolean = false) {
        this.since = since;
        this.activities = activities;
        this.status = status;
        this.afk = afk;
    }

    public toPayload(): object {
        return {
            op: 3,
            d: {
                since: this.since,
                activities: this.activities.map(activity => activity.toPayload()),
                status: this.status,
                afk: this.afk
            }
        };
    }
}

export enum DiscordActivityType {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    CUSTOM = 4,
    COMPETING = 5
}

export class DiscordActivity {
    public name: string;
    public type: DiscordActivityType;
    public url?: string;
    public createdAt: number;
    public timestamps?: { start?: number; end?: number };
    public applicationId?: string;
    public details?: string;
    public state?: string;
    public emoji?: { name: string; id?: string; animated?: boolean };
    public party?: { id?: string; size?: [number, number] };
    public assets?: { largeImage?: string; largeText?: string; smallImage?: string; smallText?: string };
    public secrets?: { join?: string; spectate?: string; match?: string };
    public instance?: boolean;
    public flags?: number;
    public buttons?: Array<{ label: string; url: string }>;

    constructor(name: string, type: DiscordActivityType, state?: string, details?: string) {
        this.name = name;
        this.type = type;
        this.details = details;
        this.state = state;
        this.createdAt = Date.now();
    }

    public toPayload(): object {
        return {
            name: this.name,
            type: this.type,
            url: this.url,
            created_at: this.createdAt,
            timestamps: this.timestamps,
            application_id: this.applicationId,
            details: this.details,
            state: this.state,
            emoji: this.emoji,
            party: this.party,
            assets: this.assets,
            secrets: this.secrets,
            instance: this.instance,
            flags: this.flags,
            buttons: this.buttons
        };
    }
}
