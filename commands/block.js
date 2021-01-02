const Discord = require("discord.js");

module.exports = {
    name: "block",
    aliases: ["bloquear"],
    guildOnly: true,
    description: "Bloqueia um canal do filtro de frases.",
    execute(message, args, database) {
        try {
            if (message.member.hasPermission("ADMINISTRATOR")) {
                const guildBlockedChannels = database
                    .get("channels")
                    .find({ guildId: message.channel.guild.id })
                    .value();
                if (guildBlockedChannels === undefined) {
                    database
                        .get("channels")
                        .push({
                            guildId: message.channel.guild.id,
                            blocked: [message.channel.id],
                        })
                        .write();
                    const embed = new Discord.MessageEmbed()
                        .setColor("#77dd77")
                        .setTitle("Sucesso!")
                        .setDescription(
                            `O filtro não verificará mais este canal.`
                        );
                    return message.reply(embed);
                } else {
                    if (
                        guildBlockedChannels.blocked.includes(
                            message.channel.id
                        )
                    ) {
                        const embed = new Discord.MessageEmbed()
                            .setColor("#fdfd96")
                            .setTitle("Alerta")
                            .setDescription(
                                "Este canal já está bloqueado. Deseja desbloquear?"
                            );
                        message.reply(embed).then((confirmationMessage) => {
                            confirmationMessage.react("👍");
                            confirmationMessage.react("👎");
                            const filter = (reaction, user) => {
                                return (
                                    ["👍", "👎"].includes(
                                        reaction.emoji.name
                                    ) && user.id === message.author.id
                                );
                            };
                            confirmationMessage
                                .awaitReactions(filter, {
                                    max: 1,
                                    time: 10000,
                                    errors: ["time"],
                                })
                                .then((reacted) => {
                                    const reaction = reacted.first();

                                    if (reaction.emoji.name === "👍") {
                                        let blockedChannels =
                                            guildBlockedChannels.blocked;
                                        blockedChannels.splice(
                                            blockedChannels.indexOf(
                                                message.channel.id
                                            ),
                                            1
                                        ),
                                            database
                                                .get("channels")
                                                .find({
                                                    guildId:
                                                        message.channel.guild
                                                            .id,
                                                })
                                                .assign({
                                                    blocked: blockedChannels,
                                                })
                                                .write();
                                        const embed = new Discord.MessageEmbed()
                                            .setColor("#77dd77")
                                            .setTitle("Sucesso!")
                                            .setDescription(
                                                "O canal foi desbloqueado. (Pedido do usuário)"
                                            );
                                        confirmationMessage.reactions.removeAll();
                                        return confirmationMessage.edit(embed);
                                    } else {
                                        const embed = new Discord.MessageEmbed()
                                            .setColor("#77dd77")
                                            .setTitle("Sucesso!")
                                            .setDescription(
                                                "O canal permanecerá bloqueado. (Pedido do usuário)"
                                            );
                                        confirmationMessage.reactions.removeAll();
                                        return confirmationMessage.edit(embed);
                                    }
                                })
                                .catch(() => {
                                    const embed = new Discord.MessageEmbed()
                                        .setColor("#ff6961")
                                        .setTitle("Erro")
                                        .setDescription(
                                            "O canal permanecerá bloqueado. (Sem resposta)"
                                        );
                                    confirmationMessage.reactions.removeAll();
                                    return confirmationMessage.edit(embed);
                                });
                        });
                    } else {
                        const blockedChannels = guildBlockedChannels.blocked;
                        database
                            .get("channels")
                            .find({
                                guildId: message.channel.guild.id,
                            })
                            .assign({
                                blocked: [
                                    ...blockedChannels,
                                    message.channel.id,
                                ],
                            })
                            .write();
                        const embed = new Discord.MessageEmbed()
                            .setColor("#77dd77")
                            .setTitle("Sucesso!")
                            .setDescription(
                                `O filtro não verificará mais este canal.`
                            );
                        return message.reply(embed);
                    }
                }
            } else {
                const embed = new Discord.MessageEmbed()
                    .setColor("#ff6961")
                    .setTitle("Erro")
                    .addField(
                        "Descrição:",
                        "Você não tem permissões suficientes."
                    );
                return message.reply(embed);
            }
        } catch (err) {
            console.error(err);
            const embed = new Discord.MessageEmbed()
                .setColor("#ff6961")
                .setTitle("Erro")
                .addField(
                    "Descrição:",
                    "Houve um erro inesperado. Tente novamente."
                );
            return message.reply(embed);
        }
    },
};
