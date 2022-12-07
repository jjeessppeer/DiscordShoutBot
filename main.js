const { fork } = require('child_process');
const { tokens } = require('./config.json');
const { ShoutGroupManager, ShoutGroup } = require('./ShoutGroup.js');
const InterprocessPromise = require('./InterprocessPromise.js');

console.log('Starting main');

console.log('Forking client processes');
const child1 = fork('./client/client.js', [0, tokens[0]]);
const child2 = fork('./client/client.js', [1, tokens[1]]);
const clientProcesses = [child1, child2];
// const clientProcesses = [child1];

// child1.on('message', (message) => {
//     if (message.messageType == 'audioPacket') {
//         clientProcesses.forEach(c => {
//             c.send({
//                 messageType: 'audioPacket',
//                 data: message.data
//             });
//         });
//     }
//     else if (message.messageType == 'createGroup') {
//         // TODO: check if channel is already in a group. Leave first then.
//     }
// });

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
    // if (messageType == 'audioPacket') {
    //     shoutManager.dispatchAudioPacket(message.audioPacket, message.groupId, message.channelId);
    // }
}
child1.on('message', onClientMessage);
child2.on('message', onClientMessage);