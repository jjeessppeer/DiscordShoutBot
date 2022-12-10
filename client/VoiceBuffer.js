const { OpusEncoder } = require('@discordjs/opus')

// Time after voice buffer should automatically be transmitted.
const FLUSH_INTERVAL = 40;

const PACKET_BYTE_SIZE = 3840;
const BIT_DEPTH = 16;
const SAMPLING_FREQUENCY = 48000;
const AUDIO_CHANNELS = 2;

const encoder = new OpusEncoder(SAMPLING_FREQUENCY, AUDIO_CHANNELS);

// TODO: cache 

// Buffers voice packets for a single output channel.
// All packets must be from the same time frame.
class VoiceBuffer {
    constructor() {
        this.opusPackets = {};
    }

    hasPacketFrom(userId) {
        return (userId in this.opusPackets);
    }

    addPacket(opusPacket, userId) {
        // if (Object.keys(this.opusPackets).length === 0) {
            // this.startTime = performance.now();
            // this.flushTime = this.startTime + FLUSH_INTERVAL;
        // }
        this.opusPackets[userId] = opusPacket;
    }

    getMergedPackets() {
        // TODO: dont allocate a new buffer, store it and reset.
        // TODO: cache encoded out buffers and reuse for other channels sending the same user audio.
        const outBuffer = Buffer.alloc(PACKET_BYTE_SIZE);
        for (const userId in this.opusPackets) {
            const decoded = encoder.decode(this.opusPackets[userId]);
            for (let i = 0; i < PACKET_BYTE_SIZE; i += 2) {
                const v1 = decoded.readInt16LE(i);
                const v2 = outBuffer.readInt16LE(i);
                outBuffer.writeInt16LE(Math.max(-32767, Math.min(32767, v1 + v2)), i);
            }    
        }
        const encoded = encoder.encode(outBuffer);
        return encoded;
    }

    reset() {
        this.opusPackets = {};
    }
}

module.exports = {
    VoiceBuffer
};