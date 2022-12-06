const { fork } = require('child_process');

console.log('Starting main');

console.log('Forking client processes');
const child1 = fork('./client/client.js', [0, 'record']);
const child2 = fork('./client/client.js', [1, 'transmit']);
const clientProcesses = [child1, child2];


child1.on('message', (message) => {
    if (message.messageType == 'audioPacket') {
        clientProcesses.forEach(c => {
            c.send({
                messageType: 'audioPacket',
                data: message.data
            });
        });
    }
});

// child.on('close', function (code) {
//     console.log("child process exited with code " + code);
// });
// child1.send({ 'messageType': '', 'data': 2 });

// Send voice packets between clients.
// child1.on('message', (message) => {
//     console.log('message recieved');
// });


// class ShoutGroup {
//     super() {
//         this.connections = [];
//     }


// }