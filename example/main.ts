//import { RPCClient } from '@discord-rpc-ts';

import { RPCClient } from '../src/client';

const discordConfig = {
    clientId: '280984871685062656',
}

let count = 0

function updateActivity(rpc: RPCClient) {
    const startTimestamp = new Date(new Date().getTime() - (Math.floor(Math.random() * 10000) * 1000));

    rpc.setActivity({
        details: `Everyone here is horrid, except me and probably you`,
        state: `Playing with Discord Status ${count}`,
        startTimestamp: startTimestamp,
        largeImageKey: 'snek_large',
        largeImageText: 'tea is delicious',
        smallImageKey: 'snek_small',
        smallImageText: 'i am my own pillows',
        instance: false,
    });

    count++
    console.log(`[${new Date().toLocaleTimeString()}] Updated Rich Presence ${count}`);
}




const scopes = ['rpc', 'rpc.api', 'messages.read'];

const rpc = new RPCClient(discordConfig.clientId, { transport: 'websocket' });
console.log('Discord RPC Client created');

rpc.$rpcStatus.subscribe(() => {
    console.log('Discord RPC Client is ready!');
    updateActivity(rpc);

    setInterval(() => {
        updateActivity(rpc);
    }, 15e3);
});

rpc.login().catch(console.error);