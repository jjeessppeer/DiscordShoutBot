const { REST, Routes } = require('discord.js');
// const { clientId, guildId, token } = require('./config.json');
const { clientIds, tokens } = require('./config.json');
const { guildId } = require('./config.json');
const fs = require('node:fs');

const commands = [];

function loadCommands() {
	// Grab all the command files from the commands directory you created earlier
	const commandFiles = fs.readdirSync('./client/commands').filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const command = require(`./client/commands/${file}`);
		commands.push(command.data.toJSON());
	}
}

function registerCommands(clientId, token) {
	// Construct and prepare an instance of the REST module
	const rest = new REST({ version: '10' }).setToken(token);

	// and deploy your commands!
	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			);
			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		}
		catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
}

function clearCommands(clientId, token) {
	const rest = new REST({ version: '10' }).setToken(token);
	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: [] },
			);
			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		}
		catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
}

loadCommands();
for (let i = 0; i < clientIds.length; i++) {
	if (i == 0) registerCommands(clientIds[i], tokens[i]);
	else clearCommands(clientIds[i], tokens[i]);
}
