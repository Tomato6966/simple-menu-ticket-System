module.exports = {
	name: 'close',

	execute: async (client, message) => {
		const TicketUserId = client.settings.findKey((d) => d.channelId == message.channelId);
		if (!client.settings.has(TicketUserId)) {
			return message.reply({
				content: `:x: This Channel is not a ticket`
			});
		}
		client.settings.delete(TicketUserId);
		message.reply('Closed the Ticket deleting in 3 seconds');
		setTimeout(() => {
			message.channel.delete().catch(() => {});
		}, 3000);
	}
};
