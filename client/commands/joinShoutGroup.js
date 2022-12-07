const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joingroup')
		.setDescription('Join your channel with an existing shout group.')
		.addStringOption(option => option.setName('group_id').setDescription('The identifier of the group you want to join with.').setRequired(true)),
	async execute(interaction) {
		const user_id = interaction.user.id;
        const member = interaction.guild.members.cache.get(user_id);
		const groupId = interaction.options.getString('group_id');
		process.send({
            messageType: 'joinGroup',
            guildId: interaction.guild.id,
            channelId: member.voice.channel.id,
			groupId: groupId
        });
		await interaction.reply('Joining shout group!');
	},
};
