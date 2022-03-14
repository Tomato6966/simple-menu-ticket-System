const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'interactionCreate',
	execute: async (client, interaction) => {
		if (!interaction.isSelectMenu() || !interaction.guildId || interaction.message.author.id != client.user.id)
			return;

		client.settings.ensure(interaction.guildId, {
			TicketSystem1: {
				channel: '',
				message: '',
				category: ''
			}
		});

		let data = client.settings.get(interaction.guildId);
		if (!data.TicketSystem1.channel || data.TicketSystem1.channel.length == 0) return;

		//right ticket system
		if (
			interaction.channelId == data.TicketSystem1.channel &&
			interaction.message.id == data.TicketSystem1.message
		) {
			switch (interaction.values[0]) {
				case 'general_help':
					{
						let channel = await CreateTicket({
							OpeningMessage: 'Now creating the General Help Ticket ...',
							ClosedMessage: `General Ticket Opened in: <#{channelId}>`,
							embeds: [
								new MessageEmbed().setColor('GREEN').setTitle('How can we help you?').setTimestamp()
							]
						}).catch((e) => {
							return console.log(e);
						});
						console.log(channel.name); //work in the channel ... Awaiting message .. application etc.
					}
					break;
				case 'ordering_help':
					{
						let channel = await CreateTicket({
							OpeningMessage: 'Now creating the Ordering Help Ticket ...',
							ClosedMessage: `Ordering Ticket Opened in: <#{channelId}>`,
							embeds: [
								new MessageEmbed().setColor('ORANGE').setTitle('How can we help you?').setTimestamp()
							]
						}).catch((e) => {
							return console.log(e);
						});
						console.log(channel.name); //work in the channel ... Awaiting message .. application etc.
					}
					break;
			}

			async function CreateTicket(ticketdata) {
				return new Promise(async function (resolve, reject) {
					await interaction.reply({
						ephemeral: true,
						content: ticketdata.OpeningMessage
					});
					let { guild } = interaction.message;
					let category = guild.channels.cache.get(data.TicketSystem1.category);
					if (!category || category.type != 'GUILD_CATEGORY')
						category = interaction.message.channel.parentId || null;
					let optionsData = {
						type: 'GUILD_TEXT',
						topic: `${interaction.user.tag} | ${interaction.user.id}`,
						permissionOverwrites: []
					};
					if (client.settings.has(interaction.user.id)) {
						let TicketChannel = guild.channels.cache.get(
							client.settings.get(interaction.user.id, 'channelId')
						);
						if (!TicketChannel) {
							client.settings.delete(interaction.user.id);
						} else {
							return interaction.editReply({
								ephemeral: true,
								content: `you already have a Ticket <#${TicketChannel.id}>`
							});
						}
					}
					optionsData.permissionOverwrites = [...guild.roles.cache.values()]
						.sort((a, b) => b?.rawPosition - a.rawPosition)
						.map((r) => {
							let Obj = {};
							if (r.id) {
								Obj.id = r.id;
								Obj.type = 'role';
								Obj.deny = [
									'SEND_MESSAGES',
									'VIEW_CHANNEL',
									'EMBED_LINKS',
									'ADD_REACTIONS',
									'ATTACH_FILES'
								];
								Obj.allow = [];
								return Obj;
							} else {
								return false;
							}
						})
						.filter(Boolean);
					//Add USER ID Permissions to the TICKET
					optionsData.permissionOverwrites.push({
						id: interaction.user.id,
						type: 'member',
						allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ADD_REACTIONS', 'ATTACH_FILES'],
						deny: []
					});
					//if there are too many, remove the first ones..
					while (optionsData.permissionOverwrites.length >= 99) {
						optionsData.permissionOverwrites.shift();
					}
					if (category) optionsData.parent = category;
					guild.channels
						.create(`ticket-${interaction.user.username.split(' ').join('-')}`.substr(0, 32), optionsData)
						.then(async (channel) => {
							await channel
								.send({
									content: `<@${interaction.user.id}>`,
									embeds: ticketdata.embeds
								})
								.catch(() => {});
							client.settings.set(interaction.user.id, {
								userId: interaction.user.id,
								channelId: channel.id
							});
							await interaction
								.editReply({
									ephemeral: true,
									content: ticketdata.ClosedMessage.replace('{channelId}', channel.id)
								})
								.catch(() => {});
							resolve(channel);
						})
						.catch((e) => {
							reject(e);
						});
				});
			}
		}
	}
};
