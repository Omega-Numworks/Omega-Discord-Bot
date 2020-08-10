"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client = new discord_js_1.Client();
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const yaml_1 = __importDefault(require("yaml"));
const moment_1 = __importDefault(require("moment"));
const owoifier = require('@zuzak/owo');
const config = yaml_1.default.parse(fs_1.default.readFileSync("config.yaml", "utf8"));
const Commands = config.Commands;
let customCommandMap = loadCommandsFromStorage();
const nasa = config["NASA_API_KEY"];
const forbiddenList = [
    "crypter",
    "crypté",
    "cryptage",
    "cryptation",
    "encrypter"
];
const chiffrer = new discord_js_1.RichEmbed()
    .setURL("https://chiffrer.info")
    .setAuthor("La Langue Française", "https://chiffrer.info/wp-content/uploads/2016/07/ic_lock_outline_black_48dp_2x.png", "https://chiffrer.info")
    .setTimestamp(new Date().getTime())
    .setDescription("ON DIT CHIFFRER, ET PAS CRYPTER. :-)");
function loadCommandsFromStorage() {
    const file = fs_1.default.readFileSync("customCommands.json", "utf8");
    const commandList = JSON.parse(file);
    const commandMap = new Map();
    commandList.forEach((command) => {
        commandMap.set(command.name, command);
    });
    return commandMap;
}
client.on('ready', () => {
    console.log(`Connected as ${client.user.tag}!`);
});
client.on('message', async (message) => {
    if (message.author.bot)
        return;
    const messageContent = message.content;
    const issuePosition = messageContent.indexOf("#");
    if (issuePosition === -1 || messageContent[issuePosition + 1] === "<")
        return;
    const issueID = messageContent.substring(issuePosition + 1).split(" ")[0];
    let index = issuePosition + issueID.length;
    if (messageContent.charAt(issuePosition - 1) === "<" && messageContent.charAt(index) === ">")
        return;
    const link = issueID.charAt(issueID.length - 1) === 'e' ? config["Numworks-Repository"] : config["Omega-Repository"];
    const { status, data } = (await axios_1.default.get(`https://api.github.com/repos/${link}/issues/${issueID}`));
    if (status === 404)
        return message.channel.send("Erreur lors de la requête (404)");
    const { html_url, title, number, body, created_at, closed_at, closed_by, assignees, comments, locked, pull_request, state, comments_url, user, labels } = data;
    const embed = new discord_js_1.RichEmbed()
        .setURL(html_url)
        .setTitle(`${title} (#${number})`)
        .setAuthor(user.login, user.avatar_url, user.html_url)
        .setDescription(body)
        .setTimestamp(Date.parse(created_at));
    const AdditionalInformations = [];
    if (state !== "open") {
        AdditionalInformations.push(`:x: Closed by ${closed_by.login} ${moment_1.default(closed_at).fromNow()} (${moment_1.default(closed_at).format("D, MMMM YYYY, HH:mm:ss")})`);
        embed.setColor("a30000");
    }
    else {
        AdditionalInformations.push(":white_check_mark: Open");
        embed.setColor("2b2b2b");
    }
    if (labels.length !== 0) {
        const labelsMap = labels.map(item => item.name);
        AdditionalInformations.push(`:label: Labels : ${labelsMap.join(', ')}`);
    }
    if (assignees.length) {
        const assignMap = assignees.map(item => item.login);
        AdditionalInformations.push(`:person_frowning: Assigned to ${assignMap.join(', ')}`);
    }
    if (locked)
        AdditionalInformations.push(":lock: locked");
    if (pull_request)
        AdditionalInformations.push(":arrows_clockwise: Pull request");
    if (comments !== 0)
        AdditionalInformations.push(`:speech_balloon: Comments : ${comments}`);
    if (issueID.toLowerCase() === number + "c") {
        const data = (await axios_1.default.get(comments_url)).data;
        data.forEach((item) => {
            embed.addField(`**Answer of**${item.user.login}** ${moment_1.default(item.created_at).fromNow()} (${moment_1.default(item.created_at).format("D, MMMM YYYY, HH:mm:ss")})**`, item.body);
        });
    }
    embed.addField("Additional informations", AdditionalInformations.join('\n'))
        .setFooter(client.user.tag, client.user.avatarURL);
    message.channel.send(embed);
});
client.on('message', async (message) => {
    var _a;
    if (message.author.bot)
        return;
    const messageContent = message.content;
    if (messageContent.toLowerCase() === "good bot")
        return message.reply("Good human!");
    if (messageContent.toLowerCase() === "bad bot")
        return message.reply("Sorry :(");
    for (let forbidden of forbiddenList) {
        if (messageContent.toLowerCase().includes(forbidden)) {
            return message.channel.send(chiffrer);
        }
    }
    if (message.channel.id === config.Channel) {
        let m = messageContent.toString().split(" ")[0].trim();
        let lastChar = m.charAt(m.length - 1);
        let multiplier = 1;
        if (lastChar.toUpperCase() === 'S') {
            multiplier = 1000;
        }
        let duration = m.substr(0, m.length - 1);
        let durationInteger = parseInt(duration);
        if (isNaN(durationInteger)) {
            durationInteger = 30;
            multiplier = 1000;
        }
        let durationComplete = multiplier * durationInteger;
        if (durationComplete > config.DurationMax)
            durationComplete = config.DurationMax;
        else if (durationComplete <= config.DurationMin)
            durationComplete = config.DurationMin;
        setTimeout(() => {
            message.delete(0).catch(reason => console.log("The Message was already destroyed"));
        }, durationComplete);
    }
    if (!messageContent.startsWith(config.Prefix))
        return;
    const [command, ...args] = messageContent.slice(config.Prefix.length).toLowerCase().trim().split(/\s+/);
    if (command === Commands.help.input) {
        const response = new discord_js_1.RichEmbed()
            .setTitle("Here are the commands you can use with me")
            .setThumbnail(client.user.displayAvatarURL)
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (const command of Object.values(Commands)) {
            response.addField(config.Prefix + command.input, command.description);
        }
        message.channel.send(response);
        return;
    }
    else if (command === Commands.repository.input) {
        const response = new discord_js_1.RichEmbed()
            .setTitle("Here are the repositories of the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (const repository of Commands.repository.repositories) {
            response.addField(repository.name, `${repository.desc} (${repository.url})`);
        }
        message.channel.send(response);
        return;
    }
    else if (command === Commands.team.input) {
        const response = new discord_js_1.RichEmbed()
            .setTitle("Here are the people who develop the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        const team = await JSON.parse(fs_1.default.readFileSync("team.json", "utf8"));
        team.forEach(element => {
            var _a;
            response.addField(element.name, `Role : ${element.role} \n Github : ${element.Github} \n Discord : ${(_a = client.users.get(element.DiscordId)) === null || _a === void 0 ? void 0 : _a.tag}`, true);
        });
        message.channel.send(response);
        return;
    }
    else if (command === Commands.apod.input) {
        let argsMessage = args.join(' ');
        if (!moment_1.default(argsMessage, "YYYY-MM-DD").isValid()) {
            argsMessage = "";
        }
        if (!argsMessage.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)) {
            argsMessage = "";
        }
        let s = moment_1.default(argsMessage, "YYYY-MM-DD");
        if (s.isAfter(moment_1.default.now()))
            argsMessage = "";
        if (s.isBefore(moment_1.default("1995-06-17")))
            argsMessage = "";
        const embed = await getEmbedApod(message, argsMessage);
        return message.channel.send(embed);
    }
    else if (command === "reload") {
        customCommandMap = loadCommandsFromStorage();
        message.reply("The command list was reloaded");
        return;
    }
    else if (command === "custom") {
        if (!(message.author.id === "339132422946029569" || message.author.id === "171318796433227776" || message.author.id === "338625981529063425")) {
            message.reply("You do not have the permission to perform this command!");
            return;
        }
        const [subcommand, cmd, ...action] = args;
        if (subcommand === "set") {
            const actionString = action.join(" ");
            if (cmd === "" || actionString === "") {
                return message.reply("You can't create an empty command!");
            }
            let command = {
                "name": cmd,
                "action": actionString
            };
            if (customCommandMap.has(cmd)) {
                return message.reply("This command already exist.");
            }
            customCommandMap.set(cmd, command);
            message.reply(`You successfully registered the ${cmd} command`);
        }
        else if (subcommand === "remove") {
            if (!customCommandMap.has(cmd))
                return message.reply("This command does not exist.");
            customCommandMap.delete(cmd);
            message.reply(`You successfully removed the ${cmd} command`);
        }
        else {
            const response = new discord_js_1.RichEmbed()
                .setTitle("Custom Command Help")
                .setThumbnail(client.user.displayAvatarURL)
                .setTimestamp(new Date())
                .setURL(config.URL)
                .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL)
                .addField("!custom set [cmd] [action]", "Create a command")
                .addField("!custom remove [cmd]", "Remove a custom command");
            message.channel.send(response);
        }
        return saveCustomCommands();
    }
    else if (command === Commands.customs.input) {
        const response = new discord_js_1.RichEmbed()
            .setTitle("List of custom commands")
            .setThumbnail(client.user.displayAvatarURL)
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (let command of customCommandMap.values()) {
            response.addField(`${config.Prefix}${command.name}`, command.action);
        }
        message.channel.send(response);
        return;
    }
    if (message.guild.id !== config.fun_server_id)
        return notAllowed(message);
    if (customCommandMap.has(command)) {
        message.channel.send((_a = customCommandMap.get(command)) === null || _a === void 0 ? void 0 : _a.action);
    }
    else if (command === Commands.hug.input) {
        if (!message.mentions.users.size)
            return message.reply('Are you alone :( ?');
        return sendInteraction(message, "hug", "hugged");
    }
    else if (command === Commands.kiss.input) {
        if (!message.mentions.users.size)
            return message.reply('Are you alone :( ?');
        return sendInteraction(message, "kiss", "kissed");
    }
    else if (command === Commands.cuddle.input) {
        if (!message.mentions.users.size)
            return message.reply('Are you alone :( ?');
        return sendInteraction(message, "cuddle", "cuddled");
    }
    else if (command === Commands.pat.input) {
        if (!message.mentions.users.size)
            return message.reply('Are you alone :( ?');
        return sendInteraction(message, "pat", "head-patted");
    }
    else if (command === Commands.waifu.input) {
        return sendImage(message, "waifu", "waifu");
    }
    else if (command === Commands.feed.input) {
        if (!message.mentions.users.size)
            return message.reply('Are you alone :( ?');
        return sendInteraction(message, "feed", "fed");
    }
    else if (command === Commands.owo.input) {
        if (args.length === 0)
            return message.reply("Send a text :) !");
        const owoifyMessage = await owoify(message, args.join(' '));
        message.reply(owoifyMessage);
    }
    else if (command === Commands.fact.input) {
        const fact = await getFact(message);
        message.reply(`Fun fact : ${fact}`);
    }
    else if (command === Commands.kemonomimi.input) {
        return sendImage(message, "kemonomimi", "picture");
    }
    else if (command === Commands.corona.input) {
        const user = args.join(' ') || message.author.username;
        const random = Math.floor(Math.random() * 101);
        const answer = new discord_js_1.RichEmbed()
            .setColor("#0099ff")
            .setTitle("SRAS-CoV-2 Diagnostic Machine")
            .setDescription(`The probability that **${user}** has the SRAS-CoV-2 is **${random}%**`)
            .setTimestamp();
        message.channel.send(answer);
    }
    else if (command === Commands.egg.input) {
        const user = args.join(' ') || message.author.username;
        const random = user.toLowerCase() === "quentin" || user.toLowerCase() === "téia" ? 100 : Math.floor(Math.random() * 101);
        const base = "My Magic Told Me That... **";
        const end = random > 50 ? "** is an egg!" : "** isnt an egg!";
        const answer = `${base}${user}${end}`;
        const embed = new discord_js_1.RichEmbed()
            .setColor("#0099ff")
            .setTitle("Egginator")
            .setDescription(answer)
            .setTimestamp();
        message.channel.send(embed);
    }
    else if (command === Commands.drunk.input) {
        const user = args.join(' ') || message.author.username;
        const random = user.toLowerCase() === "legmask" ? 100 : Math.floor(Math.random() * 101);
        const base = "My Magic Told Me That... **";
        const end = random > 50 ? "** is drunk!" : "** isnt drunk!";
        const answer = `${base}${user}${end}`;
        const embed = new discord_js_1.RichEmbed()
            .setColor("#0099ff")
            .setTitle("Hips!")
            .setDescription(answer)
            .setTimestamp();
        message.channel.send(embed);
    }
    else if (command === Commands.compatibility.input) {
        if (args.length < 2) {
            return message.reply("You need 2 persons to do so!");
        }
        if (args.length > 2) {
            return message.reply("Oh! Naughty you! Only 2 please ;)");
        }
        const random = Math.floor(Math.random() * 101);
        const answer = new discord_js_1.RichEmbed()
            .setColor("#0099ff")
            .setTitle("Love Calculator")
            .setDescription(`**${args[0]}** and **${args[1]}** are.... **${random}%** compatible`)
            .setTimestamp();
        message.channel.send(answer);
    }
});
function saveCustomCommands() {
    const list = [];
    for (const key of customCommandMap.keys()) {
        list.push(customCommandMap.get(key));
    }
    fs_1.default.writeFileSync("customCommands.json", JSON.stringify(list), "utf8");
}
async function sendInteraction(message, action, verb) {
    try {
        const user = message.mentions.users.first();
        if (!user)
            return message.channel.send("Merci de préciser un utilisateur");
        const url = await getNekoImageURL(action);
        if (!url)
            return message.channel.send("an error occured");
        const answer = new discord_js_1.RichEmbed()
            .setTitle(`@${user.username} is ${verb} by @${message.author.username}`)
            .setImage(url)
            .addField("Provided by : ", "nekos.life");
        message.channel.send(answer);
    }
    catch (e) {
        console.log(e);
        return message.channel.send("an error occured");
    }
}
async function getNekoImageURL(action) {
    const { data: { url } } = await axios_1.default.get(`https://nekos.life/api/v2/img/${action}`);
    return url;
}
async function sendImage(message, action, text) {
    try {
        const url = await getNekoImageURL(action);
        if (!url)
            return message.channel.send("an error occured");
        let answer = new discord_js_1.RichEmbed()
            .setTitle("Here is your " + text)
            .setImage(url)
            .addField("Provided by : ", "nekos.life");
        message.channel.send(answer);
    }
    catch (e) {
        console.log(e);
        return message.channel.send("an error occured");
    }
}
async function owoify(message, text) {
    return owoifier.translate(text);
}
async function getFact(message) {
    const { data: { fact } } = await axios_1.default.get('https://nekos.life/api/v2/fact');
    if (!fact)
        return message.channel.send("an error occured");
    return fact;
}
async function getEmbedApod(message, date = "") {
    let link = `https://api.nasa.gov/planetary/apod?api_key=${nasa}${`&date=${date.trim()}`}`;
    const { data: { url, copyright, explanation } } = await axios_1.default.get(link);
    if (!url)
        return message.channel.send("an error occured");
    const answer = new discord_js_1.RichEmbed()
        .setTitle("NASA Astronomy Picture of the Day")
        .setAuthor(copyright)
        .setImage(url)
        .setDescription(explanation);
    return answer;
}
function notAllowed(message) {
    message.reply("Fun commands are not allowed on this server, go to https://discord.gg/rm85hDH");
}
client.login(config.Token);
