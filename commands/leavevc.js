const { SlashCommandBuilder } = require('discord.js');
const voiceEcho = require('./../voiceEcho.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leavevc')
		.setDescription('Leave the voice chat of the user.'),
	async execute(interaction) {

        const user_id = interaction.user.id;
        const member = interaction.guild.members.cache.get(user_id);
		voiceEcho.leave(member.voice.channel);
        // console.log(member.voice.channel);


        // console.log('_VOICE_');
        // console.log('_CHANNEL_');
        // console.log(member.voice.channel);
        // console.log(interaction.user.id.toString());
        // interaction.guild.members.cache.filter(member => member.voice.channel);
        // await interaction.followUp('Pong again!');

		await interaction.reply('Leaving voice chat.');
	},
};
