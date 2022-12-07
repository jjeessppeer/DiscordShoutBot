const { Events } = require('discord.js');
const { getVoiceConnection, VoiceConnectionStatus, EndBehaviorType } = require('@discordjs/voice');
const { clientIds } = require('./../../config.json');
module.exports = {
	name: Events.VoiceStateUpdate,
	once: false,
	execute(oldState, newState) {
		// console.log(newState);

		// const guildId = newState.guild.id;
		// const connection = getVoiceConnection(guildId);
		// // console.log(connection);
		// if (connection != undefined) {
		// 	console.log('*VOICE STATE CHANGED FOR ACTIVE VC*');
		// 	console.log(this);
		// 	// console.log(connection.);
		// }

		// TODO: subscribe to users.
	},
};
