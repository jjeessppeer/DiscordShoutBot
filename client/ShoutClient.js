const fs = require('node:fs');
const { Events } = require('discord.js');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType }
    = require('@discordjs/voice');
const InterprocessPromise = require('../utils/InterprocessPromise.js');
const { clientIds } = require('../config.json');
const { OpusEncoder } = require('@discordjs/opus');
const { VoiceBuffer } = require('./VoiceBuffer.js');

class ShoutClient {
    constructor(clientIndex = 0, enableCommands = false) {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
        this.clientIndex = clientIndex;

        // Map userId to audio subscriptions.
        this.audioSubscriptions = {};
        this.voiceBuffers = {};
        this.bufferStartTime = performance.now();

        if (enableCommands) this.loadCommands();

        this.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
            const guildId = newState.guild.id;
            if (!newState.channel) return;
            const channelId = newState.channel.id;
            const connection = getVoiceConnection(guildId);
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
                        userId: userId,
                        opusPacket: chunk
                    });
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

        
    }

    joinVoiceChat(guildId, channelId) {
        console.log('Client joining VC');
        const guild = this.client.guilds.cache.get(guildId);
        const channel = guild.channels.cache.get(channelId);
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        this.voiceBuffers[guild.id] = new VoiceBuffer();
        return connection;
    }

    leaveVoiceChat(guildId, channelId) {
        console.log('Client leaving VC');
        const guild = this.client.guilds.cache.get(guildId);
        const connection = getVoiceConnection(guildId);
        connection.disconnect();
        connection.destroy();
    }

    audioRecieved(opusPacket, userId, targetGuilds) {
        for (const guildId of targetGuilds) {
            const voiceBuffer = this.voiceBuffers[guildId];
            // If the buffer already has a packet from the user, play it first.
            if (voiceBuffer.hasPacketFrom(userId)) {
                const connection = getVoiceConnection(guildId);
                const mergedPacket = voiceBuffer.getMergedPackets();
                connection.playOpusPacket(mergedPacket);
                voiceBuffer.reset();
            }
            this.voiceBuffers[guildId].addPacket(Buffer.from(opusPacket), userId);
        }
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

module.exports = {
    ShoutClient
};