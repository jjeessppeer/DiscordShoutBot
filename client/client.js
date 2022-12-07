const fs = require('node:fs');
const { Events } = require('discord.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType }
    = require('@discordjs/voice');

class ShoutClient {
    constructor(clientIndex = 0, enableCommands = false) {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
        this.clientIndex = clientIndex;

        if (enableCommands) this.loadCommands();

        // Load events
        const eventFiles = fs.readdirSync('./client/events').filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`./events/${file}`);
            if (event.once) {
                this.client.once(event.name, (...args) => event.execute(...args));
            }
            else {
                this.client.on(event.name, (...args) => event.execute(...args));
            }
        }

        process.on('message', (message) => {
            if (message.messageType == 'joinVC') {
                console.log('Client joining VC');
                const guild = this.client.guilds.cache.get(message.guildId);
                const channel = guild.channels.cache.get(message.channelId);
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
                // TODO: send join confirmation.
                // connection.once(VoiceConnectionStatus.Ready, readyCallback);
            }
        });
    }

    async login(token) {
        await this.client.login(token);
    }

    loadCommands() {
        console.log('Loading commands');
        this.client.commands = new Collection();
        const commandFiles = fs.readdirSync('./client/commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                this.client.commands.set(command.data.name, command);
            }
            else {
                console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
            }
        }
    }
}


// process.on('message', (message) => {
//     // if (process.argv[2] == 0) return;
//     if (message.messageType == 'audioPacket') {
//         const b = Buffer.from(message.data.data);
//         const connection = getVoiceConnection('1048931377636188252');
//         connection.playOpusPacket(b);
//     }
// });

async function start(clientIndex, token) {
    console.log('initializing client 1');
    const client = new ShoutClient(clientIndex, true);
    console.log('initializing client 1');
    await client.login(token);
}


start(process.argv[2], process.argv[3]);