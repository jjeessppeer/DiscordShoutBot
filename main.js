const { fork } = require('child_process');
const { tokens } = require('./config.json');
const { ShoutGroupManager, ShoutGroup } = require('./ShoutGroup.js');

console.log('Starting main');

console.log('Forking client processes');
const child1 = fork('./client/client.js', [0, tokens[0]]);
const child2 = fork('./client/client.js', [1, tokens[1]]);
const clientProcesses = [child1, child2];
// const clientProcesses = [child1];

child1.on('message', (message) => {
    if (message.messageType == 'audioPacket') {
        clientProcesses.forEach(c => {
            c.send({
                messageType: 'audioPacket',
                data: message.data
            });
        });
    }
    else if (message.messageType == 'createGroup') {
        // TODO: check if channel is already in a group. Leave first then.
    }
});

// Intialize shout manager
const shoutManager = new ShoutGroupManager(clientProcesses);

function onClientMessage(message) {
    const messageType = message.messageType;
    if (messageType == 'createGroup') {
        console.log('Shout creation requested');
        const groupId = shoutManager.createShoutGroup();
        shoutManager.joinVoiceChat(groupId, message.channelId, message.guildId);
    }
    if (messageType == 'joinGroup') {
        console.log('Shout join requested');
        shoutManager.joinVoiceChat(message.groupId, message.channelId, message.guildId);
    }
}
child1.on('message', onClientMessage);
child2.on('message', onClientMessage);


// child.on('close', function (code) {
//     console.log("child process exited with code " + code);
// });
// child1.send({ 'messageType': '', 'data': 2 });

// Send voice packets between clients.
// child1.on('message', (message) => {
//     console.log('message recieved');
// });