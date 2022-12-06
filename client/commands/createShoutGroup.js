const { SlashCommandBuilder } = require('discord.js');
const voiceEcho = require('./../voiceEcho.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('creategroup')
		.setDescription('Create a new shout group for your voice channel.'),
	async execute(interaction) {
		const user_id = interaction.user.id;
        const member = interaction.guild.members.cache.get(user_id);
		// voiceEcho.join(member.voice.channel, member);

        process.send({
            messageType: 'createGroup',
            guildId: interaction.guild.id,
            channelId: member.voice.channel.id
        });
		await interaction.reply('Creating shout group');
	},
};
