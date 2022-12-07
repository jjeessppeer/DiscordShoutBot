const crypto = require('crypto');

const resolvers = {};
const rejecters = {};
const pendingPromises = {};

function incrementPending(pid) {
    if (pid in pendingPromises) {
        pendingPromises[pid] += 1;
    }
    else {
        pendingPromises[pid] = 1;
    }
}
function decrementPending(pid) {
    pendingPromises[pid] -= 1;
    // if (pendingPromises[pid] == 0) {
    //     // remove listener
    //     delete pendingPromises[pid];
    // }
}

function resolvePromise(promiseIdentifier, pid, ...args) {
    decrementPending(pid);
    // TODO: remove event listener if there are no pending events.
    resolvers[promiseIdentifier](...args);
    delete resolvers[promiseIdentifier];
    delete rejecters[promiseIdentifier];
}

function rejectPromise(promiseIdentifier, pid, ...args) {
    decrementPending(pid);
    // TODO: remove event listener if there are no pending events.
    rejecters[promiseIdentifier](...args);
    delete resolvers[promiseIdentifier];
    delete rejecters[promiseIdentifier];
}

function sendMessage(targetProcess, messageType, data) {
    if (!(targetProcess.pid in pendingPromises)) {
        // Listen for resolution from other process.
        targetProcess.on('message', (message) => {
            if (message.messageType == 'resolvePromise') {
                resolvePromise(message.promiseIdentifier, targetProcess.pid, ...message.args);
            }
            if (message.messageType == 'rejectPromise') {
                rejectPromise(message.promiseIdentifier, targetProcess.pid, ...message.args);
            }
        });
    }
    incrementPending(targetProcess.pid);
    let identifier = crypto.randomBytes(64).toString('hex');
    while (identifier in resolvers) {
        identifier = crypto.randomBytes(64).toString('hex');
    }
    const promise = new Promise((resolve, reject) => {
        resolvers[identifier] = resolve;
        rejecters[identifier] = reject;
    });
    targetProcess.send({
        messageType: messageType,
        promiseIdentifier: identifier,
        ...data
    });
    return promise;
}

function sendPromiseResolution(targetProcess, identifier, ...args) {
    targetProcess.send({
        messageType: 'resolvePromise',
        promiseIdentifier: identifier,
        args: args
    });
}
function sendPromiseRejection(targetProcess, identifier, ...args) {
    targetProcess.send({
        messageType: 'rejectPromise',
        promiseIdentifier: identifier,
        args: args
    });
}

module.exports = {
    sendMessage,
    sendPromiseResolution,
    sendPromiseRejection,
};