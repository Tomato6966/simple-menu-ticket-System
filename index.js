const Discord = require("discord.js"); //import discord.js
const config = require("./config.json"); //Import config such as token and prefix
const Enmap = require("enmap");
//create a new client
const client = new Discord.Client({
  allowedMentions: {
    parse: ["roles", "users"],
    repliedUser: false,
  },
  partials: ['MESSAGE', 'CHANNEL'],
  intents: [ 
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
  ],
});

client.settings = new Enmap({name: "settings"});

client.on("ready", () => {
    console.log(`${client.user.tag} is now ready to be used!`);
})

client.login(config.token)

client.on("messageCreate", async (message) => {
    if(!message.guild || message.author.bot) return;

    let args = message.content.slice(config.prefix.length).trim().split(" ");
    let cmd = args.shift()?.toLowerCase();

    if(!message.content.startsWith(config.prefix) || !cmd || cmd.length == 0) return;

    client.settings.ensure(message.guildId, {
        TicketSystem1: {
            channel: "",
            message: "",
            category: "",
        }
    })

    if(cmd == "ping") {
        return message.reply(`Pong! \`${client.ws.ping}ms\``)
    }
    if(cmd == "close") {
        let TicketUserId = client.settings.findKey(d => d.channelId == message.channelId);

        if(!client.settings.has(TicketUserId)){
            return message.reply({
                content: `:x: This Channel is not a ticket`
            })
        }
        client.settings.delete(TicketUserId);
        message.reply("Closed the Ticket deleting in 3 seconds");
        setTimeout(() => {
            message.channel.delete().catch(()=>{});
        }, 3000)
    }
    if(cmd == "setup") {
        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]); 
        if(!channel) return message.reply(":x: Please ping the Channel");

        let TicketEmbed = new Discord.MessageEmbed()
            .setColor("BLURPLE")
            .setTitle("🎫 Create a Ticket")
            .setDescription("Select for what you need help with")
            .setFooter(message.guild.name, message.guild.iconURL({dynamic: true}));
        
            let Menu = new Discord.MessageSelectMenu()
            .setCustomId("FirstTicketOpeningMenu")
            .setPlaceholder("Click me to open a Ticket")
            .setMaxValues(1) 
            .setMinValues(1)
            .addOptions([ //maximum 25 items
                {
                    label: "General Help".substr(0, 25), //maximum 25 Letters long
                    value: "general_help".substr(0, 25), //maximum 25 Letters long
                    description: "If you have a Question about our stuff".substr(0, 50), //maximum 50 Letters long
                    emoji: "👌", //optional
                },
                {
                    label: "Ordering Help".substr(0, 25), //maximum 25 Letters long
                    value: "ordering_help".substr(0, 25), //maximum 25 Letters long
                    description: "If you need help with ordering".substr(0, 50), //maximum 50 Letters long
                    emoji: "👍", //optional
                }
            ])
        let row = new Discord.MessageActionRow().addComponents(Menu);
        
        channel.send({
            embeds: [TicketEmbed],
            components: [row]
        }).then((msg) => {
            client.settings.set(message.guildId, channel.id, "TicketSystem1.channel")
            client.settings.set(message.guildId, msg.id, "TicketSystem1.message")
            client.settings.set(message.guildId, channel.parentId, "TicketSystem1.category")
            return message.reply("👍 **Setupped**");
        }).catch((e) => {
            console.log(e);
            return message.reply("Something went wrong");
        })
    }
})

client.on("interactionCreate", async (interaction) => {
    if(!interaction.isSelectMenu() || !interaction.guildId || interaction.message.author.id != client.user.id) return
    
    client.settings.ensure(interaction.guildId, {
        TicketSystem1: {
            channel: "",
            message: "",
            category: "",
        }
    })

    let data = client.settings.get(interaction.guildId)
    if(!data.TicketSystem1.channel || data.TicketSystem1.channel.length == 0) return

    //right ticket system
    if(interaction.channelId == data.TicketSystem1.channel && interaction.message.id == data.TicketSystem1.message) {        
        switch(interaction.values[0]){
            case "general_help": {
                let channel = await CreateTicket({
                    OpeningMessage: "Now creating the General Help Ticket ...",
                    ClosedMessage: `General Ticket Opened in: <#{channelId}>`,
                    embeds: [ new Discord.MessageEmbed().setColor("GREEN").setTitle("How can we help you?").setTimestamp()]
                }).catch(e=>{
                    return console.log(e)
                })
                console.log(channel.name); //work in the channel ... Awaiting message .. application etc.
            } break;
            case "ordering_help": {
                let channel = await CreateTicket({
                    OpeningMessage: "Now creating the Ordering Help Ticket ...",
                    ClosedMessage: `Ordering Ticket Opened in: <#{channelId}>`,
                    embeds: [ new Discord.MessageEmbed().setColor("ORANGE").setTitle("How can we help you?").setTimestamp()]
                }).catch(e=>{
                    return console.log(e)
                })
                console.log(channel.name); //work in the channel ... Awaiting message .. application etc.
            } break;
        }
        
        async function CreateTicket(ticketdata) {
            return new Promise(async function(resolve, reject) {
                await interaction.reply({
                    ephemeral: true,
                    content: ticketdata.OpeningMessage
                })
                let { guild } = interaction.message;
                let category = guild.channels.cache.get(data.TicketSystem1.category);
                if(!category || category.type != "GUILD_CATEGORY") category = interaction.message.channel.parentId || null; 
                let optionsData = {
                    type: "GUILD_TEXT",
                    topic: `${interaction.user.tag} | ${interaction.user.id}`,
                    permissionOverwrites: [],
                }
                if(client.settings.has(interaction.user.id)){
                    let TicketChannel = guild.channels.cache.get(client.settings.get(interaction.user.id, "channelId"))
                    if(!TicketChannel) {
                        client.settings.delete(interaction.user.id)
                    } else {
                        return interaction.editReply({
                            ephemeral: true,
                            content: `you already have a Ticket <#${TicketChannel.id}>`
                        })
                    }
                }
                optionsData.permissionOverwrites = [...guild.roles.cache.values()].sort((a, b) => b?.rawPosition - a.rawPosition).map(r => {
                    let Obj = {}
                    if(r.id){
                        Obj.id = r.id;
                        Obj.type = "role";
                        Obj.deny = ["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "ADD_REACTIONS", "ATTACH_FILES"]
                        Obj.allow = [];
                        return Obj;
                    } else {
                        return false;
                    }
                }).filter(Boolean);
                //Add USER ID Permissions to the TICKET
                optionsData.permissionOverwrites.push({
                    id: interaction.user.id,
                    type: "member",
                    allow: ["SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "ADD_REACTIONS", "ATTACH_FILES"],
                    deny: [],
                })
                //if there are too many, remove the first ones..
                while (optionsData.permissionOverwrites.length >= 99){
                optionsData.permissionOverwrites.shift();
                }
                if(category) optionsData.parent = category;
                guild.channels.create(`ticket-${interaction.user.username.split(" ").join("-")}`.substr(0, 32), optionsData).then(async channel => {
                    await channel.send({
                        content: `<@${interaction.user.id}>`,
                        embeds: ticketdata.embeds
                    }).catch(()=>{});
                    client.settings.set(interaction.user.id, {
                        userId: interaction.user.id,
                        channelId: channel.id,
                    })
                    await interaction.editReply({
                        ephemeral: true,
                        content: ticketdata.ClosedMessage.replace("{channelId}", channel.id)
                    }).catch(()=>{});
                    resolve(channel);
                }).catch((e)=>{
                    reject(e)
                });
            })
            
        }

    } 
})