const { fork } = require('child_process');

console.log('Starting main');

console.log('Forking client process');
const child = fork('./client/client.js', [0]);
const child2 = fork('./client/client.js', [1]);

// child.on('close', function (code) {
//     console.log("child process exited with code " + code);
// });
// child.send(29);