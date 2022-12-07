const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Events } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const { clientIds, tokens } = require('./config.json');

const GUILD_ID = '1048931377636188252';
const CHANNEL_ID = '1048931378693161073';
const subscribed_users = [];

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

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
        if (clientIds.includes(userId)) continue; // User is one of the bots.
        console.log(`Subscribed to audio stream: ${userId}`);
        subscribed_users.push(userId);

        // Subscribe to user audio.
        const reciever = connection.receiver;
        const subscription = reciever.subscribe(
            userId,
            { end: { behavior: EndBehaviorType.Manual } }
        );

        // PROBLEM LIES HERE!
        subscription.on('data', (chunk) => {
            connection.playOpusPacket(chunk);
        });
    }
}

async function start() {
    client.on(Events.VoiceStateUpdate, voiceStateChange);
    await client.login(tokens[0]);
    joinVC();
}

start();