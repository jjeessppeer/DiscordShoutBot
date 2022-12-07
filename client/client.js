const fs = require('node:fs');
const { Events } = require('discord.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType }
    = require('@discordjs/voice');
const InterprocessPromise = require('./../InterprocessPromise.js');
const { clientIds } = require('./../config.json');

const AUDIO_BUFFER_SIZE = 2; // Amount of voice packets to buffer before transmitting.
const AUIDO_FLUSH_INTERVAL = 10;

class ShoutClient {
    constructor(clientIndex = 0, enableCommands = false) {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
        this.clientIndex = clientIndex;

        // Map userId to audio subscriptions.
        this.audioSubscriptions = {};

        this.audioBuffers = {};

        if (enableCommands) this.loadCommands();

        this.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
            const guildId = newState.guild.id;
            const channelId = newState.channel.id;
            const connection = getVoiceConnection(guildId);
            // console.log(connection);
            if (connection == undefined) return;

            // Iterate over all member in the channel and subscribe to their audio.
            const members = newState.channel.members;
            for (const [userId, member] of members) {
                if (userId in this.audioSubscriptions) continue; // Already subscribed.
                if (clientIds.includes(userId)) continue; // User is one of the bots.
                const reciever = connection.receiver;
                const subscription = reciever.subscribe(
                    userId,
                    { end: { behavior: EndBehaviorType.Manual } });
                subscription.on('data', (chunk) => {
                    process.send({
                        messageType: 'audioPacket',
                        guildId: guildId,
                        channelId: newState.channel.id,
                        opusPacket: chunk
                    });
                    // this.audioBuffers[channelId].push(chunk);
                    // if (this.audioBuffers[channelId].length > AUDIO_BUFFER_SIZE) {
                    //     const buffer = Buffer.concat(this.audioBuffers[channelId]);
                    //     this.audioBuffers[channelId] = [];
                    //     console.log('BUFFER SENT');
                    // }
                    // connection.playOpusPacket(chunk);
                });
                this.audioSubscriptions[userId] = subscription;
            }
            console.log(`Subscriptions: ${Object.keys(this.audioSubscriptions)}`);
        });

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
                // TODO: check if alreay in voice chat
                // TODO: error on failed join (because of perissions etc.)
                const guild = this.client.guilds.cache.get(message.guildId);
                const channel = guild.channels.cache.get(message.channelId);
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
                // InterprocessPromise.sendPromiseRejection(process, message.promiseIdentifier, 'No permission to join voice channel.');
                connection.on(VoiceConnectionStatus.Ready, () => {
                    InterprocessPromise.sendPromiseResolution(process, message.promiseIdentifier);
                });

                this.audioBuffers[channel.id] = [];
            }
            if (message.messageType == 'audioPacket') {
                const connection = getVoiceConnection(message.guildId);
                const buffer = Buffer.from(message.opusPacket);
                connection.playOpusPacket(buffer);
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

async function start(clientIndex, token) {
    const client = new ShoutClient(clientIndex, true);
    await client.login(token);
}

start(process.argv[2], process.argv[3]);