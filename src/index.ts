import { HaikuClient } from 'jshaiku';
import { Intents } from 'discord.js';
import config from './config/main.json' assert {type: 'json'};

import gameManager from './utils/gameManager.js';

const client = new HaikuClient({
    intents: new Intents(32767).bitfield,
}, config);

await client.registerCommandsIn("./commands");
// await client.registerEventsIn("./events");

client.on("ready", () => {});

client.gameManager = new gameManager(client);

await client.login();