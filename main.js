require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const brain = require("brain.js");
const moment = require("moment-timezone");
const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const {
    globalPrefix,
    richPresence,
    token,
    env,
    nnConfig,
} = require("./assets/config");
const trainingData = require("./assets/training");

const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

const net = new brain.recurrent.LSTM();

moment.locale("pt-BR");
moment.tz.setDefault("America/Maceio");

const adapter = new FileSync("assets/database.json");
const database = lowdb(adapter);
database
    .defaults({
        filters: [],
        channels: [],
    })
    .write();

client.on("ready", () => {
    console.log(
        `Preparado com o ID: ${client.user.id}, iniciando treinamento.`
    );
    setInterval(() => {
        let presence = Math.floor(Math.random() * richPresence.length);
        client.user.setActivity(richPresence[presence], {
            type: "COMPETING",
        });
    }, 7000);

    const trainingStart = moment();
    net.train(trainingData, nnConfig);
    const trainingTime = moment(moment() - trainingStart).format(
        "mm [minutos e] ss [segundos]"
    );
    console.log("O treinamento foi finalizado em:", trainingTime);
});

const commandsList = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"));

for (const command of commandsList) {
    const cmd = require(`./commands/${command}`);
    client.commands.set(cmd.name, cmd);
}

client.on("message", async (message) => {
    if (
        !message.content.startsWith(globalPrefix) &&
        message.author.id !== client.user.id
    ) {
        const isChannelBlocked = database
            .get("channels")
            .find({ guildId: message.channel.guild.id })
            .value();
        if (
            isChannelBlocked === undefined ||
            !isChannelBlocked.blocked.includes(message.channel.id)
        ) {
            const isFilterEnabled = database
                .get("filters")
                .find({ guildId: message.channel.guild.id })
                .value();

            if (
                isFilterEnabled === undefined ||
                isFilterEnabled.mode === "enabled"
            ) {
                const messageLevel = net.run(message.content);
                env === "development" ? console.log(messageLevel) : null;
                if (messageLevel === "1") {
                    const embed = new Discord.MessageEmbed()
                        .setColor("#fdfd96")
                        .setTitle("Alerta")
                        .addField(
                            "Descrição:",
                            `Frase com palavra(s) inadequada(s) detectada. [${message.content}]`
                        )
                        .setFooter(
                            `Mensagem enviada por: ${message.author.username}`,
                            message.author.avatarURL()
                        );

                    message.reply(embed);
                }
            }
        }
    }

    if (!message.content.startsWith(globalPrefix) || message.author.bot) return;

    const args = message.content.slice(globalPrefix.length).split(" ");
    const commandName = args.shift().toLowerCase();

    const command =
        client.commands.get(commandName) ||
        client.commands.find(
            (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
        );

    if (!command) return;

    if (command.guildOnly === true && message.channel.type !== "text") {
        const embed = new Discord.MessageEmbed()
            .setColor("#ff6961")
            .setTitle("Erro")
            .addField(
                "Descrição:",
                "Este comando só pode ser executado em servidores."
            );
        return message.reply(embed);
    }

    if (command.args && !args.length) {
        let description = "Este comando precisa de argumentos.";

        if (command.usage) {
            description += `\nO modo de usar este comando é: **${globalPrefix}${command.name} ${command.usage}**`;
        }

        const embed = new Discord.MessageEmbed()
            .setColor("#ff6961")
            .setTitle("Erro")
            .addField("Descrição:", description);

        return message.channel.send(embed);
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = moment().valueOf();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = 5 * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime =
            timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            const embed = new Discord.MessageEmbed()
                .setColor("#ff6961")
                .setTitle("Erro")
                .addField(
                    "Descrição:",
                    `Você ainda precisa esperar ${timeLeft.toFixed(
                        1
                    )} segundos para usar esse comando.`
                );
            return message.reply(embed).then((sendedMessage) => {
                setTimeout(() => {
                    sendedMessage.delete();
                }, 3000);
            });
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        command.execute(message, args, database);
    } catch (error) {
        console.error(error);
        const embed = new Discord.MessageEmbed()
            .setColor("#ff6961")
            .setTitle("Erro")
            .addField(
                "Descrição:",
                "Houve um erro ao tentar executar esse comando."
            );
        message.reply(embed);
    }
});

client.login(token);
