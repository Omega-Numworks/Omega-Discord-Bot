import { Client, RichEmbed, Message } from 'discord.js';
const client = new Client();

import fs from 'fs'
import axios from "axios";

import yaml from "yaml";

import moment from "moment";
import ON_DEATH from 'death';


// CONFIG
const config = yaml.parse(fs.readFileSync("config.yaml", "utf8"));
const Commands = config.Commands;
let customCommandMap = loadCommandsFromStorage();
const nasa = config["NASA_API_KEY"];

const forbiddenList: string[] = [
    "crypter",
    "crypté",
    "cryptage",
    "cryptation",
    "encrypter"
];

const chiffrer: RichEmbed = new RichEmbed()
    .setURL("https://chiffrer.info")
    .setAuthor("La Langue Française", "https://chiffrer.info/wp-content/uploads/2016/07/ic_lock_outline_black_48dp_2x.png", "https://chiffrer.info")
    .setTimestamp(new Date().getTime())
    .setDescription("ON DIT CHIFFRER, ET PAS CRYPTER. :-)")

function loadCommandsFromStorage() {
    const file = fs.readFileSync("custom.json", "utf8")
    const commandList = JSON.parse(file);
    const commandMap = new Map();
    for (let i = 0; i < commandList.length; i++) {
        let command = commandList[i];
        commandMap.set(command.name, command);
    }
    return commandMap;
}

client.on('ready', () => {
    console.log(`Connected as ${client.user.tag}!`);
});

client.on('message', async (message: Message) => {
    const messageContent = message.content

    if (messageContent.toLowerCase() === "good bot") return message.reply("Good human!");
    if (messageContent.toLowerCase() === "bad bot") return message.reply("Sorry :(");

    for (let forbidden in forbiddenList) {
        if (messageContent.toLowerCase().includes(forbiddenList[forbidden])) {
            message.channel.send(chiffrer);
            break;
        }
    }


    const issuePosition: number = messageContent.indexOf("#");
    if (issuePosition > -1 && messageContent[issuePosition + 1] !== "<") {
        if (messageContent.substring(issuePosition + 1).includes(" ")) {
            IssueId = messageContent.substring(issuePosition + 1).split(" ")[0]
        } else {
            IssueId = messageContent.substring(issuePosition + 1)
        }
        let index = issuePosition + IssueId.length
        if (!(cloneMsg.charAt(issuePosition - 1) === "<" && cloneMsg.charAt(index) === ">")) {

            let link = config["Omega-Repository"];
            if (IssueId.charAt(IssueId.length - 1) === 'e') {
                link = config["Numworks-Repository"];
            }
            const { body } = await axios.get(`https://api.github.com/repos/${link}/issues/${IssueId}`, {
                    'User-Agent': 'Omega-Discord-Bot'
            })
            ;((error, response, body) => {
                body = JSON.parse(body);
                if (error)
                    message.channel.send("ERROR : " + error.toString());
                if (response.statusCode === 200) {
                    let embed = new RichEmbed()
                        .setURL(body.html_url)
                        .setTitle(body.title + " (#" + body.number + ")")
                        .setAuthor(body.user.login, body.user.avatar_url, body.user.html_url)
                        .setDescription(body.body)
                        .setTimestamp(Date.parse(body.created_at));
                    let AdditionalInformations = "";
                    if (body.state !== "open") {
                        AdditionalInformations += ":x: Closed by " + body.closed_by.login + " " + moment(body.closed_at).fromNow() + " (" + moment(body.closed_at).format("D, MMMM YYYY, HH:mm:ss") + " )\n";
                        embed.setColor("a30000")
                    } else {
                        AdditionalInformations += ":white_check_mark: Open\n";
                        embed.setColor("2b2b2b")
                    }
                    if (body.labels.length !== 0) {
                        AdditionalInformations += ":label: Labels : ";
                        body.labels.forEach((item, index) => {
                            if (index !== 0) {
                                AdditionalInformations += ", "
                            }
                            AdditionalInformations += item.name
                        });
                        AdditionalInformations += "\n"
                    }
                    if (body.assignees.length !== 0) {
                        AdditionalInformations += ":person_frowning: Assigned to ";
                        body.assignees.forEach((item, index) => {
                            if (index !== 0) {
                                AdditionalInformations += ", "
                            }
                            AdditionalInformations += item.login
                        });
                        AdditionalInformations += "\n"
                    }
                    if (body.locked) {
                        AdditionalInformations += ":lock: locked\n"
                    }
                    if (body.pull_request !== undefined) {
                        AdditionalInformations += ":arrows_clockwise: Pull request\n"
                    }
                    if (body.comments !== 0) {
                        AdditionalInformations += ":speech_balloon: Comments : " + body.comments + "\n"
                    }
                    if (IssueId.toLowerCase() === body.number + "c") {
                        request({
                            url: body.comments_url,
                            headers: {
                                'User-Agent': 'Omega-Discord-Bot'
                            }
                        }, (err, resp, bod) => {
                            bod = JSON.parse(bod);
                            bod.forEach((item) => {
                                message.addField("**Answer of** " + item.user.login + " **" + moment(item.created_at).fromNow() + " (" + moment(item.created_at).format("D, MMMM YYYY, HH:mm:ss") + " )**", item.body)
                            });
                            message.addField("Additional informations", AdditionalInformations)
                                .setFooter(client.user.tag, client.user.avatarURL);
                            msg.channel.send(message)
                        })
                    } else {
                        message.addField("Additional informations", AdditionalInformations)
                            .setFooter(client.user.tag, client.user.avatarURL);
                        msg.channel.send(message)
                    }
                }
            })
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
            msg.delete(0).catch(reason => console.log("The Message was already destroyed"))
        }, durationComplete)

    }

    if (!messageContent.startsWith(config.Prefix)) return

    const withoutPrefix = messageContent.replace(config.Prefix, "");
    const [command, ...args] = withoutPrefix.toLocaleLowerCase().trim().split(/\s+/)

    if (command === Commands.help.input) {
        let response = new RichEmbed()
            .setTitle("Here are the commands you can use with me")
            .setThumbnail(client.user.displayAvatarURL)
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (i in Commands) {
            item = Commands[i];
            response.addField(config.Prefix + item.input, item.description)
        }
        msg.channel.send(response);
    } else if (command === Commands.repository.input) {
        let response = new RichEmbed()
            .setTitle("Here are the repositories of the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (i in Commands.repository.repository) {
            item = Commands.repository.repository[i];
            response.addField(item.name, item.desc + " (" + item.url + ")")
        }
        msg.channel.send(response);
    } else if (command === Commands.team.input) {
        let response = new RichEmbed()
            .setTitle("Here are the people who develop the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        let team = JSON.parse(fs.readFileSync(Commands.team.file));
        team.forEach(element => {
            response.addField(element.name, "Github : " + element.Github + " Discord : " + client.users.find(user => user.id === element.DiscordId).tag)
        });
        msg.channel.send(response);
    } else if (command === Commands.hug.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        if (!msg.mentions.users.size) {
            msg.reply('Are you alone :( ?')
            return;
        }
        sendHug(msg, "hug", "hugged");
    } else if (command === Commands.kiss.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        if (!msg.mentions.users.size) {
            msg.reply('Are you alone :( ?')
            return;
        }
        sendHug(msg, "kiss", "kissed");
    } else if (command === Commands.cuddle.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        if (!msg.mentions.users.size) {
            msg.reply('Are you alone :( ?')
            return;
        }
        sendHug(msg, "cuddle", "cuddled");
    } else if (command === Commands.pat.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        if (!msg.mentions.users.size) {
            msg.reply('Are you alone :( ?')
            return;
        }
        sendHug(msg, "pat", "head-patted");
    } else if (command === Commands.waifu.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        sendImage(msg, "waifu", "waifu");
    } else if (command === Commands.feed.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        if (!msg.mentions.users.size) {
            msg.reply('Are you alone :( ?')
            return;
        }
        sendHug(msg, "feed", "fed");
    } else if (command === Commands.owo.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        let message = WithoutPrefix.substr(3, WithoutPrefix.length);
        if (message.length === 0) {
            msg.reply("Send a text :) !")
            return;
        }
        owoify(msg, message);
    } else if (command === Commands.fact.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        fact(msg);
    } else if (command === Commands.kemonomimi.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        sendImage(msg, "kemonomimi", "picture");
    } else if (command === Commands.apod.input) {
        let message = withoutPrefix.substr(4, withoutPrefix.length);
        if (!moment(message, "YYYY-MM-DD").isValid()) {
            message = "";
        }
        if (!message.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)) {
            message = "";
        }
        let s = moment(message, "YYYY-MM-DD");
        if (s.isAfter(moment.now()))
            message = "";
        if (s.isBefore(moment("1995-06-17")));
        message = "";
        if (message.length > 0) {
            apod(msg, message, false)
            return;
        }
        apod(msg, message, true);
    } else if (command === "reload") {
        customCommandMap = loadCommandsFromStorage();
        msg.reply("The command list was reloaded")
    } else if (command === "custom") {
        if (!((msg.author.id === "339132422946029569") || (msg.author.id === "171318796433227776"))) {
            msg.reply("You do not have the permission to perform this command!");
            return;
        }
        let message = WithoutPrefix.trim().substr(7, WithoutPrefix.length).trim().split(" ");
        let subcommand = message.shift().trim();
        if (subcommand === "set") {
            let cmd = message.shift().trim();
            let action = message.join(" ");
            if (cmd.trim() === "") {
                msg.reply("You can't create an empty command!")
                return;
            }
            if (action.trim() === "") {
                msg.reply("You can't create an empty command!")
                return;
            }
            let command = {
                "name": cmd,
                "action": action
            }
            if (customCommandMap.has(cmd)) {
                msg.reply("This command already exist.");
                return;
            }
            customCommandMap.set(cmd, command);
            msg.reply("You successfully registered the " + cmd + " command")
        } else if (subcommand === "remove") {
            let cmd = message.shift().trim();
            if (!customCommandMap.has(cmd)) {
                msg.reply("This command does not exist.")
                return;
            }
            customCommandMap.delete(cmd);
            msg.reply("You successfully removed the " + cmd + " command")
        } else {
            let response = new RichEmbed()
                .setTitle("Custom Command Help")
                .setThumbnail(client.user.displayAvatarURL)
                .setTimestamp(new Date())
                .setURL(config.URL)
                .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL)
                .addField("!custom set [cmd] [action]", "Create a command")
                .addField("!custom remove [cmd]", "Remove a custom command")
            msg.channel.send(response);
        }
        saveCustomList()
    } else if (command === Commands.customs.input) {
        let response = new RichEmbed()
            .setTitle("List of custom commands")
            .setThumbnail(client.user.displayAvatarURL)
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        let list = [];
        for (let key of customCommandMap.keys()) {
            list.push(customCommandMap.get(key));
        }
        for (let command of list) {
            response.addField(config.Prefix + command.name, command.action);
        }
        msg.channel.send(response);
    } else if (command === Commands.corona.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        let user;

        let message = WithoutPrefix.trim().substr(6, WithoutPrefix.length).trim();
        if (message === "") {
            user = msg.author.username;
        } else {
            user = message;
        }

        let random = Math.floor(Math.random() * 101);
        let answer = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("SRAS-CoV-2 Diagnostic Machine")
            .setDescription("The probability that **" + user + "** has the SRAS-CoV-2 is **" + random + "%**")
            .setTimestamp()

        msg.channel.send(answer);

    } else if (command === Commands.egg.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        let user;

        let message = WithoutPrefix.trim().substr(3, WithoutPrefix.length).trim();
        if (message === "") {
            user = msg.author.username;
        } else {
            user = message;
        }

        let random = Math.floor(Math.random() * 101);
        let base = "My Magic Told Me That... **";
        if (user.toLowerCase() === "quentin") {
            random = 100
        }
        random > 50 ? base = base + user + "** is an egg!" : base = base + user + "** isnt an egg!";
        let answer = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("Egginator")
            .setDescription(base)
            .setTimestamp()
        msg.channel.send(answer);
    } else if (command === Commands.drunk.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        let user;
        let message = WithoutPrefix.trim().substr(5, WithoutPrefix.length).trim();
        if (message === "") {
            user = msg.author.username;
        } else {
            user = message;
        }

        let random = Math.floor(Math.random() * 101);
        let base = "My Magic Told Me That... **";
        if (user.toLowerCase() === "LeGmask".toLowerCase()) {
            random = 100
        }
        random > 50 ? base = base + user + "** is drunk!" : base = base + user + "** isnt drunk!";
        let answer = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("Hips!")
            .setDescription(base)
            .setTimestamp()
        msg.channel.send(answer);
    } else if (command === Commands.compatibility.input) {
        if (msg.guild.id !== "685936220395929600") {
            notAllowed(msg);
            return;
        }
        let message = WithoutPrefix.trim().substr(13, WithoutPrefix.length).trim().split(" ");
        if (message.length < 2) {
            msg.reply("You need 2 persons to do so!");
            return;
        }
        if (message.length > 2) {
            msg.reply("Oh! Naughty you! Only 2 please ;)")
            return;
        }
        let random = Math.floor(Math.random() * 101);
        let answer = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("Love Calculator")
            .setDescription("**" + message[0] + "** and **" + message[1] + "** are.... **" + random + "%** compatible")
            .setTimestamp()
        msg.channel.send(answer)
    } else {
        if (customCommandMap.has(command)) {
            message.channel.send(customCommandMap.get(command).action);
        }
    }

    /* Guild Commands */
    /* hug, kiss, cuddle, pat, waifu, feed, owo, fact, kemonomimi, corona, egg, drunk, compat*/
});

function saveCustomList() {
    let list = [];
    for (let key of customCommandMap.keys()) {
        list.push(customCommandMap.get(key));
    }
    fs.writeFileSync("custom.json", JSON.stringify(list), "utf8");
}

async function sendHug(msg, action, verb) {
    try {
        const user = msg.mentions.users.first();
        const data = await (await fetch('https://nekos.life/api/v2/img/' + action)).json();
        if ((!(data || data.url)))
            return msg.channel.send("an error occured");
        let answer = new RichEmbed()
            .setTitle("@" + user.username + "" + " is " + verb + " by @" + msg.author.username + "")
            .setImage(data.url)
            .addField("Provided by : ", "nekos.life")
        msg.channel.send(answer)
    } catch (e) {
        console.log(e)
        return msg.channel.send("an error occured")
    }
}

async function sendImage(msg, action, text) {
    try {
        const data = await (await fetch('https://nekos.life/api/v2/img/' + action)).json();
        if ((!(data || data.url)))
            return msg.channel.send("an error occured");
        let answer = new RichEmbed()
            .setTitle("Here is your " + text)
            .setImage(data.url)
            .addField("Provided by : ", "nekos.life")
        msg.channel.send(answer)
    } catch (e) {
        console.log(e)
        return msg.channel.send("an error occured")
    }
}

async function owoify(msg, text) {
    const data = await (await fetch('https://nekos.life/api/v2/owoify?text=' + escape(text))).json();
    if ((!(data || data.owo)))
        return msg.channel.send("an error occured");
    msg.reply(data.owo)
}

async function fact(msg) {
    const data = await (await fetch('https://nekos.life/api/v2/fact')).json();
    if ((!(data || data.fact))) {
        return msg.channel.send("an error occured");
    }
    msg.reply("Fun fact : " + data.fact)
}

async function apod(msg, date, defaul) {

    let link = 'https://api.nasa.gov/planetary/apod?api_key=' + nasa;
    if (!defaul) {
        link = link + "&date=" + date.trim();
    }
    const data = await (await fetch(link)).json();
    if ((!(data || data.url))) {
        return msg.channel.send("an error occured");
    }
    let answer = new RichEmbed()
        .setTitle("NASA Astronomy Picture of the Day")
        .setAuthor(data.copyright)
        .setImage(data.url)
        .setDescription(data.explanation);
    msg.channel.send(answer);
}

function notAllowed(message: Message) {
    message.reply("Fun commands are not allowed on this server, go to https://discord.gg/rm85hDH")
}

ON_DEATH(function (signal, err) {
    console.log("Destroying the bot.");
    saveCustomList();
    client.destroy();
    process.exit();
});



client.login(config.Token);