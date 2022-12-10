const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { OpusEncoder } = require('@discordjs/opus');
const { Events } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const { clientIds, tokens } = require('./config.json');
const util = require('util');
const { decode } = require('punycode');
const { VoiceBuffer } = require('./client/VoiceBuffer.js');

const GUILD_ID = '1048931377636188252';
const CHANNEL_ID = '1048931378693161073';
const BOT_TOKEN = tokens[0];
const CLIENT_ID = clientIds[0];

const subscribed_users = [];


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const encoder = new OpusEncoder(48000, 2);
const voiceBuffer = new VoiceBuffer();


function joinVC() {
    const guild = client.guilds.cache.get(GUILD_ID);
    const channel = guild.channels.cache.get(CHANNEL_ID);

    const connection = joinVoiceChannel({
        channelId: CHANNEL_ID,
        guildId: GUILD_ID,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
}

function voiceStateChange(oldState, newState) {
    const guildId = newState.guild.id;
    const channelId = newState.channel.id;
    const connection = getVoiceConnection(guildId);
    if (connection == undefined) return;

    const members = newState.channel.members;
    for (const [userId, member] of members) {
        if (subscribed_users.includes(userId)) continue; // Already subscribed.
        if (userId == CLIENT_ID) continue; // the bot itself.
        console.log(`Subscribed to audio stream: ${userId}`);
        subscribed_users.push(userId);

        // Subscribe to user audio.
        const reciever = connection.receiver;
        const subscription = reciever.subscribe(
            userId,
            { end: { behavior: EndBehaviorType.Manual } }
        );

        subscription.on('data', (chunk) => {
            if (voiceBuffer.hasPacketFrom(userId)) {
                const outPacket = voiceBuffer.getMergedPackets(userId);
                connection.playOpusPacket(outPacket);
                voiceBuffer.reset();
            }
            voiceBuffer.addPacket(chunk, userId);
            // voiceBuffer.
            
        });
    }
}

async function start() {
    client.on(Events.VoiceStateUpdate, voiceStateChange);
    await client.login(BOT_TOKEN);
    setTimeout(() => { joinVC(); }, 400);
}

start();