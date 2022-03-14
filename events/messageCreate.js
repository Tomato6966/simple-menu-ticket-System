const { parse } = require('discord-command-parser');

module.exports = {
	name: 'messageCreate',
	execute: async (client, message) => {
		if (!message.guild || message.author.bot) return;

		const parsed = parse(message, client.prefix, { ignorePrefixCase: true });
		if (!parsed.success) return;

		const commandName = parsed.command.toLowerCase();
		if (!client.commands.has(commandName)) return;

		const cmd = client.commands.get(commandName);
		if (!cmd) return;

		client.settings.ensure(message.guildId, {
			TicketSystem1: {
				channel: '',
				message: '',
				category: ''
			}
		});

		try {
			cmd?.execute(client, message, parsed);
		} catch (error) {
			message.reply('there was an error trying to execute that command.');
			console.error(error);
		}
	}
};
