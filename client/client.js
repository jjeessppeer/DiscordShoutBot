const { ShoutClient } = require('./ShoutClient.js'); 
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, EndBehaviorType }
    = require('@discordjs/voice');
const InterprocessPromise = require('../utils/InterprocessPromise.js');

const CLIENT_INDEX = process.argv[2];
const BOT_TOKEN = process.argv[3];
const shoutClient = new ShoutClient(CLIENT_INDEX, true);

process.on('message', (message) => {
    if (message.messageType == 'joinVC') {
        const connection = shoutClient.joinVoiceChat(message.guildId, message.channelId);
        // InterprocessPromise.sendPromiseRejection(process, message.promiseIdentifier, 'No permission to join voice channel.');
        connection.on(VoiceConnectionStatus.Ready, () => {
            InterprocessPromise.sendPromiseResolution(process, message.promiseIdentifier);
        });

    }
    if (message.messageType == 'audioPacket') {
        // const connection = getVoiceConnection(message.guildId);
        // const buffer = Buffer.from(message.opusPacket);
        // connection.playOpusPacket(buffer);
        // console.log(message);
        // console.log(message.targetGuilds)
        shoutClient.audioRecieved(message.opusPacket, message.userId, message.targetGuilds);
    }
});


async function start() {
    await shoutClient.login(BOT_TOKEN);
}

start();
