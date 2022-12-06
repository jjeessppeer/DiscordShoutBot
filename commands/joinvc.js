const { SlashCommandBuilder } = require('discord.js');
const voiceEcho = require('./../voiceEcho.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joinvc')
		.setDescription('Join the voice chat of the user.'),
	async execute(interaction) {
		// console.log(interaction);
		console.log('Joining voice chat.');
		const user_id = interaction.user.id;
        const member = interaction.guild.members.cache.get(user_id);
		// voiceEcho.join(member.voice.channel, member);
		voiceEcho.join(member);
		await interaction.reply('Joining voice chat!');
	},
};
