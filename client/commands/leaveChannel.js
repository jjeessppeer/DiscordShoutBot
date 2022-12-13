const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave_channel')
		.setDescription('Remove the bot from your current channel.'),
	async execute(interaction) {
		const user_id = interaction.user.id;
        const member = interaction.guild.members.cache.get(user_id);
		// TODO: use promise, check if successful.
		process.send({
            messageType: 'leaveChannel',
            guildId: interaction.guild.id,
            channelId: member.voice.channel.id,
        });
		await interaction.reply('Leaving channel!');
	},
};
