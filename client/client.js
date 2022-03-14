const { Client, Intents, Collection } = require('discord.js');
const { prefix } = require('../config.json');
const Enmap = require('enmap');
const path = require('path');
const fs = require('fs');

class BotClient extends Client {
	settings = new Enmap({ name: 'settings' });
	events = new Collection();
	commands = new Collection();
	prefix = prefix;

	constructor(options) {
		super(options);
	}

	async init() {
		// load commands
		const commandsPath = path.join(__dirname, '..', 'commands');
		const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

		for (const file of commandFiles) {
			const command = require(`${commandsPath}/${file}`);
			if (!command) continue;

			console.log(`Loading: ${file} as ${command.name}`);

			this.commands.set(command.name, command);
			if (!command?.aliases) continue;

			command.aliases.forEach((alias) => {
				this.commands.set(alias, command);
				console.log(`Loading: ${file} as ${alias}`);
			});
		}

		// load events
		const eventsPath = path.join(__dirname, '..', 'events');
		const eventsFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
		for (const file of eventsFiles) {
			const event = await require(`${eventsPath}/${file}`);
			if (!event) continue;
			this.events.set(event.name, event);
			this.on(event.name, event.execute.bind(null, this));
		}
	}
}

const client = new BotClient({
	allowedMentions: {
		parse: ['roles', 'users'],
		repliedUser: false
	},
	partials: ['MESSAGE', 'CHANNEL'],
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});

module.exports = { client };
