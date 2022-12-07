// const { InterprocessPromise } = require('./InterprocessPromise.js');
const { fork } = require('child_process');
const InterprocessPromise = require('./InterprocessPromise.js');

async function start() {
    // InterprocessPromise.listen();
    console.log('Forking process');
    const child1 = fork('./promisetest2.js');
    const starttime = performance.now();

    // console.log(child1);
    // const v = child1.on();
    const p0 = InterprocessPromise.sendMessage(child1, 'testmessage', { data: 'wawawa' });
    const p1 = InterprocessPromise.sendMessage(child1, 'testmessage', { data: 'wawawa' });
    const p2 = InterprocessPromise.sendMessage(child1, 'testmessage', { data: 'wawawa' });
    const p3 = InterprocessPromise.sendMessage(child1, 'testmessage', { data: 'wawawa' });
    const p4 = InterprocessPromise.sendMessage(child1, 'testmessage', { data: 'wawawa' });
    const p5 = InterprocessPromise.sendMessage(child1, 'testmessage', { data: 'wawawa' });
    p0.then((v) => console.log('0', v, (performance.now() - starttime), (performance.now() - starttime) - v));
    p1.then((v) => console.log('1', v, (performance.now() - starttime), (performance.now() - starttime) - v));
    p2.then((v) => console.log('2', v, (performance.now() - starttime), (performance.now() - starttime) - v));
    p3.then((v) => console.log('3', v, (performance.now() - starttime), (performance.now() - starttime) - v));
    p4.then((v) => console.log('4', v, (performance.now() - starttime), (performance.now() - starttime) - v));
    p5.then((v) => console.log('5', v, (performance.now() - starttime), (performance.now() - starttime) - v));
}

start();
// f1();