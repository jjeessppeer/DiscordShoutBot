const { Events } = require('discord.js');

module.exports = {
	name: Events.VoiceStateUpdate,
	once: false,
	execute(voiceState) {
		// console.log(voiceState);
	},
};
