const crypto = require('crypto');
const InterprocessPromise = require('./../utils/InterprocessPromise.js');

class ShoutGroupManager {
    // TODO: add client state check request. Check if stored state is still valid.
    constructor(clientProcesses) {
        this.clientProcesses = clientProcesses;
        this.shoutGroups = {};
        this.shoutChannels = {};
        this.guildClientUsage = {};
    }

    createShoutGroup() {
        let groupId = crypto.randomBytes(32).toString('hex');
        while (groupId in this.shoutGroups) groupId = crypto.randomBytes(128).toString('hex');
        this.shoutGroups[groupId] = new ShoutGroup(groupId);
        console.log(`Created shout group ${groupId}`);
        return groupId;
    }

    async addChannelToGroup(groupId, channelId, guildId) {
        // TODO: hancle if channel is already joined.
        // TODO: handle invalid group id.
        const clientIdx = this.getFreeClientIndex(guildId);
        const shoutChannel = new ShoutChannel(channelId, guildId, this.clientProcesses[clientIdx], clientIdx);
        await shoutChannel.requestVoiceChannelJoin();
        
        shoutChannel.addGroup(this.shoutGroups[groupId]);
        this.shoutGroups[groupId].addChannel(shoutChannel);
        
        this.shoutChannels[channelId] = shoutChannel;
        console.log(`Added channel to ${groupId}`);
    }

    async leaveChannel(guildId, channelId) {
        const shoutChannel = this.shoutChannels[channelId];
        if (shoutChannel == undefined) throw 'Error: Unable to leave that channel';
        if (shoutChannel.guildId != guildId) throw 'Error: Unable to leave that channel';
        
        // Remove the channel from groups.
        // console.log(shoutChannel.connectedGroups);
        for (const group of shoutChannel.connectedGroups) {
            // console.log(group);
            group.removeChannel(shoutChannel);
        }

        // Request the client to leave channel
        await InterprocessPromise.sendMessage(shoutChannel.clientProcess, 'leaveChannel', {
            channelId: channelId,
            guildId: guildId
        });

        console.log(this.guildClientUsage);
        // Free up the client in the guild
        const idx = this.guildClientUsage[guildId].indexOf(shoutChannel.clientIdx);
        this.guildClientUsage[guildId].splice(idx, 1);
        if (this.guildClientUsage[guildId].length == 0) delete this.guildClientUsage[guildId];
        console.log(this.guildClientUsage);
        // Delete the shout channel
        delete this.shoutChannels[channelId];
    }

    dispatchAudioPacket(opusPacket, channelId, originGuildId, userId) {
        const clientGuildMap = this.shoutChannels[channelId].getClientGuildMap();
        for (const clientIdx in clientGuildMap) {
            if (clientGuildMap[clientIdx].length == 0) continue; 
            // if (shoutChannel.guildId == originGuildId) continue;
            this.clientProcesses[clientIdx].send({
                messageType: 'audioPacket',
                opusPacket: opusPacket,
                guildId: originGuildId,
                originGuildId: originGuildId,
                userId: userId,
                targetGuilds: clientGuildMap[clientIdx]
            });
        }
        // for (const targetChannel of targetChannelIds) {
        //     const shoutChannel = this.shoutChannels[tId];
        //     // if (shoutChannel.guildId == originGuildId) continue;
        //     console.log(shoutChannel.guildId, ' | ', originGuildId);
        //     count += 1;
        //     this.shoutChannels[tId].sendAudioPacket(opusPacket);
        // }
        // console.log(count);
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
}

class ShoutChannel {
    constructor(channelId, guildId, clientProcess, clientIdx) {
        this.connectedGroups = [];
        // this.connectedGroup = ;
        this.channelId = channelId;
        this.guildId = guildId;
        this.clientProcess = clientProcess;
        this.clientIdx = clientIdx; 
        this.connected = false;
    }

    addGroup(shoutGroup) {
        this.connectedGroups.push(shoutGroup);
    }

    getClientGuildMap() {
        // TODO: Cache and reuse instead. Only changes on channel join/leave or group creation.
        const clientGuildMap = { };
        for (const shoutGroup of this.connectedGroups) {
            for (const shoutChannel of shoutGroup.channels) {
                if (!clientGuildMap[shoutChannel.clientIdx]) clientGuildMap[shoutChannel.clientIdx] = [];
                if (clientGuildMap[shoutChannel.clientIdx].includes(shoutChannel.guildId)) continue;
                clientGuildMap[shoutChannel.clientIdx].push(shoutChannel.guildId);
            }
        }
        return clientGuildMap;
    }

    getConnectedChannels() {
        let channels = [];
        for (const shoutGroup of this.connectedGroups) {
            for (const shoutChannel of shoutGroup.channels) {
                // TODO: check for duplicate channels.
                channels.push(shoutChannel);
            }
        }
        return channels;
    }

    async requestVoiceChannelJoin() {
        // TODO: remove function and move to manager.
        await InterprocessPromise.sendMessage(this.clientProcess, 'joinVC', {
            channelId: this.channelId,
            guildId: this.guildId
        });
        this.connected = true;
    }

    async sendAudioPacket(opusPacket) {
        this.clientProcess.send({
            messageType: 'audioPacket',
            opusPacket: opusPacket,
            guildId: this.guildId
        });
    }
}

class ShoutGroup {
    constructor(groupId) {
        this.groupId = groupId;
        this.channels = [];
        this.channelIds = [];
    }

    addChannel(channel) {
        this.channels.push(channel);
        this.channelIds.push(channel.channelId);
        // this.channelToGuild[channelId] = guildId;
    }

    removeChannel(channel) {
        const channelId = channel.channelId;
        const idx = this.channels.findIndex((element) => element.channelId == channelId);
        this.channels.splice(idx, 1);
    }
}

module.exports = {
    ShoutGroupManager,
    // ShoutGroup
};