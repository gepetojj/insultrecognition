const Discord = require("discord.js");

module.exports = {
    name: "ping",
    args: false,
    guildOnly: false,
    description: "Testa a latência do servidor.",
    execute(message) {
        message.channel.startTyping();
        let calcEmbed = new Discord.MessageEmbed()
            .setColor("#5d5ced")
            .setTitle("Ping")
            .addField("Latência do servidor:", `calculando...`)
            .setFooter(
                `Pedido de: ${message.author.username}`,
                message.author.avatarURL()
            );

        message.channel.send(calcEmbed).then((sendedMessage) => {
            const ping =
                sendedMessage.createdTimestamp - message.createdTimestamp;
            let pingEmbed = new Discord.MessageEmbed()
                .setColor("#5d5ced")
                .setTitle("Ping")
                .addField("Latência do servidor:", `${ping} ms`)
                .setFooter(
                    `Pedido de: ${message.author.username}`,
                    message.author.avatarURL()
                );

            sendedMessage.edit(pingEmbed);
        });
        message.channel.stopTyping();
    },
};
