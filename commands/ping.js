module.exports = {
	name: 'ping',
	aliases: ['p'],

	execute: async (client, message) => {
		message.reply(`pong! \`${client.ws.ping}ms\``);
	}
};
