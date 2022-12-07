const { fork } = require('child_process');
const { tokens } = require('./../config.json');
const { ShoutGroupManager, ShoutGroup } = require('./ShoutGroup.js');
const InterprocessPromise = require('./../utils/InterprocessPromise.js');

console.log('Starting main');

console.log('Forking client processes');
const child1 = fork('./client/client.js', [0, tokens[0]]);
const child2 = fork('./client/client.js', [1, tokens[1]]);
const clientProcesses = [child1, child2];

// Intialize shout manager
const shoutManager = new ShoutGroupManager(clientProcesses);

function onClientMessage(message) {
    const messageType = message.messageType;
    if (messageType == 'createGroup') {
        console.log('Shout creation requested');
        const promiseIdentifier = message.promiseIdentifier;
        const groupId = shoutManager.createShoutGroup();
        shoutManager.joinVoiceChat(groupId, message.channelId, message.guildId);
        InterprocessPromise.sendPromiseResolution(this, promiseIdentifier, groupId);
        // console.log(this);
    }
    if (messageType == 'joinGroup') {
        console.log('Shout join requested');
        shoutManager.joinVoiceChat(message.groupId, message.channelId, message.guildId);
    }
    if (messageType == 'audioPacket') {
        // const buffer = Buffer.from(message.opu)
        shoutManager.dispatchAudioPacket(message.guildId, message.channelId, message.opusPacket);
    }
}
child1.on('message', onClientMessage);
child2.on('message', onClientMessage);