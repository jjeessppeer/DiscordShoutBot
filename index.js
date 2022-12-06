// require('dotenv').config();
// console.log(process.env.DISCORD_TOKEN);
const fs = require('node:fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
// const { token } = require('./config.json');
const { tokens } = require('./config.json');
const voiceEcho = require('./voiceEcho.js');

// const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const clients = [];

function loadCommands(c) {
	c.commands = new Collection();
	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			c.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
		}
	}
}

function loadEvents(c) {
	const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./events/${file}`);
		if (event.once) {
			c.once(event.name, (...args) => event.execute(...args));
		}
		else {
			c.on(event.name, (...args) => event.execute(...args));
		}
	}
}


async function start() {
	// loadCommands(client);
	// loadEvents(client);
	// client.login(token);

	for (let i = 0; i < tokens.length; i++) {
		const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
		loadCommands(client);
		loadEvents(client);
		clients.push(client);
		client.login(tokens[i]);
	}
	voiceEcho.setClients(clients);
}

start();

