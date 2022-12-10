const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { OpusEncoder } = require('@discordjs/opus');
const { Events } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const { clientIds, tokens } = require('./config.json');
const util = require('util');
const { decode } = require('punycode');

const GUILD_ID = '1048931377636188252';
const CHANNEL_ID = '1048931378693161073';
const BOT_TOKEN = tokens[0];
const CLIENT_ID = clientIds[0];

const subscribed_users = [];


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const encoder = new OpusEncoder(48000, 2);

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
            // Decodes to PCM signed 16-bit little endian
            const startTime = performance.now();

            const decoded = encoder.decode(chunk);
            const decodeTime = performance.now();

            const bytes = decoded.byteLength;
            const bits = bytes * 8;
            const samples = bits / 16; // Each sample is 16 bits
            const frequency = 48000;
            const time = samples / frequency * 1000;

            const buffer2 = Buffer.alloc(bytes);
            decoded.copy(buffer2);

            // console.log(`\nNEW SAMPLE\ntime: ${time}\nBYTES: ${bytes}\nBits: ${bytes * 8}\nSamples: ${samples}`);
            // console.log(`Sample time. ${time}. Encode time: ${encodeTime-startTime}`);
            // Double volume
            for (let i = 0; i < bytes; i += 2) {
                let val = decoded.readInt16LE(i);
                val *= 5;
                val = Math.min(32767, val);
                val = Math.max(-32767, val);
                buffer2.writeInt16LE(val, i);
            }
            const editTime = performance.now();
            const reencoded = encoder.encode(buffer2);
            const encodeTime = performance.now();
            connection.playOpusPacket(reencoded);
            // process.exit();
        });
    }
}

async function start() {
    client.on(Events.VoiceStateUpdate, voiceStateChange);
    await client.login(BOT_TOKEN);
    setTimeout(() => { joinVC(); }, 400);
}

start();