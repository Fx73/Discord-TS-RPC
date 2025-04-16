//import { RPCClient } from '@discord-rpc-ts';

import { DiscordActivity, DiscordActivityType, DiscordPresence } from '../src/gateway/discord-presence';

import { RPCClient } from '../src/client';

const discordConfig = {
    clientId: '1360379286720352366',
}

let count = 0

function updateActivity(rpc: RPCClient) {
    const startTimestamp = new Date(new Date().getTime() - (Math.floor(Math.random() * 10000) * 1000));

    rpc.setActivity({
        details: `Everyone is horrid, except me and probably you`,
        state: `Playing with Discord Status ${count}`,
        startTimestamp: startTimestamp,
        largeImageKey: 'splashrounded',
        largeImageText: 'Hello!',
    });

    count++
    console.log(`[${new Date().toLocaleTimeString()}] Updated Rich Presence ${count}`);
}




const scopes = ['rpc', 'rpc.api', 'messages.read'];

const rpc = new RPCClient(discordConfig.clientId, { transport: 'websocket' });
console.log('Discord RPC Client created');


rpc.connect().then(
    () => {
        console.log('Discord RPC Client is ready!');
        const activity = new DiscordActivity("Locket Reague", DiscordActivityType.PLAYING, 'Not really in a Match', "100 - 0 every time");
        activity.applicationId = '379286085710381999';
        activity.assets = {
            largeImage: "351371005538729000",
            largeText: "DFH Stadium",
            smallImage: "351371005538729111",
            smallText: "Silver III"
        };
        const presence = new DiscordPresence([activity]);
        presence.since = 91879201;

        //rpc.setPresence(presence);
        //setInterval(() => rpc.setPresence(presence), 15e3);
    }).catch(console.error);