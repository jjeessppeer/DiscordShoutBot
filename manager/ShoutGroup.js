const crypto = require('crypto');
const InterprocessPromise = require('./../utils/InterprocessPromise.js');

class ShoutGroupManager {
    constructor(clientProcesses) {
        this.clientProcesses = clientProcesses;
        this.shoutGroups = {};
        // { guild, channel, client }
        this.channelToGroupMap = {};
        this.guildClientUsage = {};
    }

    channelIsInGroup(channelId) {
        //
    }

    getShoutGroup(channelId) {
        // Return the groupId based on channelId.
        return this.channelToGroupMap[channelId];
    }

    createShoutGroup() {
        let groupId = crypto.randomBytes(32).toString('hex');
        while (groupId in this.shoutGroups) groupId = crypto.randomBytes(128).toString('hex');
        // const shoutGroup = new ShoutGroup(groupId, this.clientProcesses);
        // const shoutGroup = {};
        this.shoutGroups[groupId] = {};
        console.log(`Created shout group ${groupId}`);
        return groupId;
        // return shoutGroup;
    }

    getFreeClientIndex(guildId) {
        // Return the first free client in the guild.
        if (guildId in this.guildClientUsage) {
            for (let i = 0; i < this.clientProcesses.length; i++) {
                if (!this.guildClientUsage[guildId].includes(i)) {
                    this.guildClientUsage[guildId].push(i);
                    return i;
                }
            }
            throw new Error('No free client avaiable');
            // return -1; // no free client for guild.
        }
        // No client previously used on this guild.
        this.guildClientUsage[guildId] = [];
        this.guildClientUsage[guildId].push(0);

        return 0;
    }

    async joinVoiceChat(groupId, channelId, guildId) {
        // TODO: check if already in that channel.
        const clientIdx = this.getFreeClientIndex(guildId);
        if (clientIdx == -1) return;
        // Request client to join channel
        // TODO: add callback/promise for the following. Should handle failed join attempts.
        await InterprocessPromise.sendMessage(this.clientProcesses[clientIdx], 'joinVC', {
            channelId: channelId,
            guildId: guildId
        });
        this.channelToGroupMap[channelId] = groupId;

        // let res = await p;
        // console.log('Response: ', res);

        this.shoutGroups[groupId][channelId] = {
            guildId: guildId,
            channelId: channelId,
            clientIdx: clientIdx
        };
        console.log(`Joining ${channelId} with group ${groupId}`);
        // return clientIdx;
    }

    leaveVC(channelId, guildId) {
        return 0;
    }

    dispatchAudioPacket(guildId, channelId, opusPacket, echo = true) {
        const groupId = this.getShoutGroup(channelId);
        const shoutGroup = this.shoutGroups[groupId];
        let count = 0;
        for (const [cid, info] of Object.entries(shoutGroup)) {
            count += 1;
            // if (!echo && cid == channelId) continue;
            this.clientProcesses[info.clientIdx].send({
                messageType: 'audioPacket',
                guildId: guildId,
                opusPacket: opusPacket
            });
        }
        // console.log(`Sent to ${count}`);

    }

}


class ShoutGroup {
    constructor(groupId) {
        this.groupId = groupId;
        this.channels = [];
        this.channelToGuild = {};
    }
    addChannel(channelId, guildId) {
        this.channels.push(channelId);
        this.channelToGuild[channelId] = guildId;
    }
}

// class ShoutChannel {
//     constructor(channelId, guildId, clientIdx) {
//         this.lastActivityTimestamp;
//         this.channelId;
//         this.guildId;
//         this.clientIdx;
//     }
// }

module.exports = {
    ShoutGroupManager,
    // ShoutGroup
};