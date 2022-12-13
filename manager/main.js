const { fork } = require('child_process');
const { tokens } = require('./../config.json');
const { ShoutGroupManager, ShoutGroup } = require('./ShoutGroup.js');
const InterprocessPromise = require('./../utils/InterprocessPromise.js');

console.log('Starting main');

const CLIENT_PROCESSES = 2;
const clientProcesses = [];

// Initialize client processes.
for (let i = 0; i < CLIENT_PROCESSES; i++) {
    console.log('Forking client processes ', i);
    const clientProcess = fork('./client/client.js', [i, tokens[i]]);
    clientProcess.on('message', onClientMessage);
    clientProcesses.push(clientProcess);
}

// Intialize shout manager
const shoutManager = new ShoutGroupManager(clientProcesses);

function onClientMessage(message) {
    const messageType = message.messageType;
    if (messageType == 'createGroup') {
        console.log('Shout creation requested');
        const promiseIdentifier = message.promiseIdentifier;
        const groupId = shoutManager.createShoutGroup();
        // TODO: handle errors from add channel below
        shoutManager.addChannelToGroup(groupId, message.channelId, message.guildId);
        InterprocessPromise.sendPromiseResolution(this, promiseIdentifier, groupId);
    }
    if (messageType == 'joinGroup') {
        console.log('Shout join requested');
        shoutManager.addChannelToGroup(message.groupId, message.channelId, message.guildId);
    }
    if (messageType == 'audioPacket') {
        // const buffer = Buffer.from(message.opu)
        shoutManager.dispatchAudioPacket(message.opusPacket, message.channelId, message.guildId, message.userId);
    }
}


