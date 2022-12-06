const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType }
    = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const fs = require('fs');

console.log('Initializing voiceecho');
let clients = [];
function setClients(c) {
    clients = c;
}

class VoiceEcho {
    constructor() {
        // this.clients = [];
        // this.channels = [];
        // this.connections = [];
        // this.users = [];
        // this.subscriptions = [];

        this.connection;
        this.subscription;
    }

    joinVC(user, readyCallback) {
        // Decide which client to join with
        // Check for first free client on server.

        console.log('Joining voice channel');
        const channelId = user.voice.channel.id;
        const channel = clients[0].channels.cache.get(channelId);
        // console.log(clients[0].voice.adapters);
        // console.log(clients[1].voice.adapters);
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        connection.once(VoiceConnectionStatus.Ready, readyCallback);
        this.connection = connection;
    }

    async leaveVC(channel) {
        const connection = getVoiceConnection(channel.guild.id);
        connection.destroy();
    }

    async subscripeToUser(user) {
        // Find which connection/channel the user is in.
        const reciever = this.connection.receiver;
        const subscription = reciever.subscribe(
            user.id,
        { end: { behavior: EndBehaviorType.Manual } });
        subscription.on('data', (chunk) => {
            // console.log('Audio packet recieved.');

            // Play the recieved audio packet pack in the voice chat.
            this.connection.playOpusPacket(chunk);
        });
    }
}

async function join(user) {
    const ve = new VoiceEcho();
    ve.joinVC(user, () => {
        ve.subscripeToUser(user);
    });

    console.log('Join done');

}

async function leave(channel) {
    const connection = getVoiceConnection(channel.guild.id);
    connection.destroy();
}


module.exports = {
    join,
    leave,
    setClients
};

// const connection = joinVoiceChannel({
// 	channelId: channel.id,
// 	guildId: channel.guild.id,
// 	adapterCreator: channel.guild.voiceAdapterCreator,
// });


// connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
// 	console.log('Connection is in the Ready state!');
// });

// player.on(AudioPlayerStatus.Playing, (oldState, newState) => {
// 	console.log('Audio player is in the Playing state!');
// });
