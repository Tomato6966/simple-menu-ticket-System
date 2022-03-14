const { MessageActionRow, MessageEmbed, MessageSelectMenu } = require('discord.js');

module.exports = {
	name: 'setup',
	aliases: ['set'],

	execute: async (client, message, args) => {
		try {
			if (!args?.success) return;

			const targetChannelId = args.reader.getChannelID();
			if (!targetChannelId) return message.reply(':x: Please ping the Channel');

			const channel = client.channels.cache.get(targetChannelId);
			if (!channel) return message.reply(':x: Channel not found');

			const TicketEmbed = new MessageEmbed()
				.setColor('BLURPLE')
				.setTitle('🎫 Create a Ticket')
				.setDescription('Select for what you need help with')
				.setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

			const Menu = new MessageSelectMenu()
				.setCustomId('FirstTicketOpeningMenu')
				.setPlaceholder('Click me to open a Ticket')
				.setMaxValues(1)
				.setMinValues(1)
				.addOptions([
					//maximum 25 items
					{
						label: 'General Help'.substr(0, 25), //maximum 25 Letters long
						value: 'general_help'.substr(0, 25), //maximum 25 Letters long
						description: 'If you have a Question about our stuff'.substr(0, 50), //maximum 50 Letters long
						emoji: '👌' //optional
					},
					{
						label: 'Ordering Help'.substr(0, 25), //maximum 25 Letters long
						value: 'ordering_help'.substr(0, 25), //maximum 25 Letters long
						description: 'If you need help with ordering'.substr(0, 50), //maximum 50 Letters long
						emoji: '👍' //optional
					}
				]);

			const row = new MessageActionRow().addComponents(Menu);

			const msg = await channel.send({ embeds: [TicketEmbed], components: [row] });
			client.settings.set(message.guildId, channel.id, 'TicketSystem1.channel');
			client.settings.set(message.guildId, msg.id, 'TicketSystem1.message');
			client.settings.set(message.guildId, channel.parentId, 'TicketSystem1.category');
		} catch (error) {
			console.error(error);
			return message.reply('Something went wrong');
		}
	}
};
