const { Events } = require('discord.js');

module.exports = {
	name: Events.VoiceStateUpdate,
	once: false,
	execute(oldState, newState) {
		console.log('Voice state changed');
	},
};
