const Discord = require("discord.js");

module.exports = {
    name: "filter",
    aliases: ["filtro"],
    args: true,
    usage: "[enabled | disabled]",
    guildOnly: true,
    description: "Ativa e desativa o filtro de frases.",
    execute(message, args, database) {
        const filterModes = ["enabled", "disabled"];
        const filterMode = args[0];

        if (!filterModes.includes(filterMode)) {
            const embed = new Discord.MessageEmbed()
                .setColor("#ff6961")
                .setTitle("Erro")
                .addField(
                    "Descrição:",
                    `O filtro só pode ser duas opções: ${filterModes}.`
                );
            return message.reply(embed);
        }

        try {
            if (message.member.hasPermission("ADMINISTRATOR")) {
                const guildFilterMode = database
                    .get("filters")
                    .find({ guildId: message.channel.guild.id })
                    .value();
                if (guildFilterMode === undefined) {
                    database
                        .get("filters")
                        .push({
                            guildId: message.channel.guild.id,
                            mode: filterMode,
                        })
                        .write();
                    const embed = new Discord.MessageEmbed()
                        .setColor("#77dd77")
                        .setTitle("Sucesso!")
                        .setDescription(
                            `O filtro foi alterado para: **${filterMode}**.`
                        );
                    return message.reply(embed);
                } else {
                    database
                        .get("filters")
                        .find({ guildId: message.channel.guild.id })
                        .assign({ mode: filterMode })
                        .write();
                    const embed = new Discord.MessageEmbed()
                        .setColor("#77dd77")
                        .setTitle("Sucesso!")
                        .setDescription(
                            `O filtro foi alterado para: **${filterMode}**.`
                        );
                    return message.reply(embed);
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
