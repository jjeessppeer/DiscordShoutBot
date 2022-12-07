const { SlashCommandBuilder } = require('discord.js');

const InterprocessPromise = require('./../../InterprocessPromise.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('creategroup')
		.setDescription('Create a new shout group for your voice channel.'),
	async execute(interaction) {
		const user_id = interaction.user.id;
		const member = interaction.guild.members.cache.get(user_id);

		const groupId = await InterprocessPromise.sendMessage(process, 'createGroup', {
			guildId: interaction.guild.id,
			channelId: member.voice.channel.id
		});
		// p.then((groupId) => { console.log(groupId); });
		await interaction.reply(`Shout group created with identifier: \`${groupId}\``);
	},
};
