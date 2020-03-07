const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");
const yaml = require("yaml");
const request = require("request");
const moment = require("moment");
const ON_DEATH = require('death');
const fetch = require("node-fetch");


// CONFIG
const ConfigLocation = "config.yaml";
const config = yaml.parse(fs.readFileSync(ConfigLocation, "utf8"));
const Commands = config.Commands;
const forbiddenList = [
    "crypter",
    "crypté",
    "cryptage",
    "cryptation",
    "encrypter"
];

let chiffrer = NaN;


client.on('ready', () => {
    console.log(`Connected as ${client.user.tag}!`);
    request(
        {
            url: "https://chiffrer.info",
            headers: {
                "User-Agent": "Omega-Discord-Bot"
            }
        },
        (error, response, body) => {
            chiffrer = new Discord.RichEmbed()
                .setURL("https://chiffrer.info")
                .setAuthor("La Langue Française", "https://chiffrer.info/wp-content/uploads/2016/07/ic_lock_outline_black_48dp_2x.png", "https://chiffrer.info")
                .setTimestamp(new Date().getTime())
                .setDescription("ON DIT CHIFFRER, ET PAS CRYPTER. :-)")
        }
    )
});

client.on('message', msg => {
    if (!msg.channel.name.toLowerCase().includes("fr")) {
        ForbiddenWordPresent = false;
        config.ForbiddenWords.forEach((item) => {
            if (msg.content.toLowerCase().includes(item)) {
                ForbiddenWordPresent = true;
            }
        });
        if (ForbiddenWordPresent) {
            msg.channel.send("**FR**\n<@" + msg.author.id + ">, " + config.ForbiddenWordsResponseFR + "\n\n**EN**\n<@" + msg.author.id + ">, " + config.ForbiddenWordsResponseEN);
            return
        }
        config.ShortForbiddenWords.forEach((item) => {
            if (msg.content.toLowerCase().includes(item)) {
                ForbiddenWordPresent = true;
            }
        });
        if (ForbiddenWordPresent) {
            msg.reply(config.ShortForbiddenWordsResponse);
            return
        }
    }
    let cloneMsg = msg.content;
    for (let forbidden in forbiddenList) {
        if (cloneMsg.toLowerCase().includes(forbiddenList[forbidden])) {
            msg.channel.send(chiffrer);
            break;
        }
    }
    IssueNumberPosition = msg.content.indexOf("#");
    if (IssueNumberPosition > -1 && msg[IssueNumberPosition + 1] !== "<") {
        if (msg.content.substring(IssueNumberPosition + 1).includes(" ")) {
            IssueId = msg.content.substring(IssueNumberPosition + 1).split(" ")[0]
        } else {
            IssueId = msg.content.substring(IssueNumberPosition + 1)
        }
        let index = IssueNumberPosition + IssueId.length
        if (!(cloneMsg.charAt(IssueNumberPosition - 1) === "<" && cloneMsg.charAt(index) === ">")) {

            let link = config["Omega-Repository"];
            if (IssueId.charAt(IssueId.length - 1) === 'e') {
                e
                link = config["Numworks-Repository"];
            }
            request({
                url: "https://api.github.com/repos/" + link + "/issues/" + IssueId,
                headers: {
                    'User-Agent': 'Omega-Discord-Bot'
                }
            }, (error, response, body) => {
                body = JSON.parse(body);
                if (error)
                    msg.channel.send("ERROR : " + error.toString());
                if (response.statusCode === 200) {
                    let message = new Discord.RichEmbed()
                        .setURL(body.html_url)
                        .setTitle(body.title + " (#" + body.number + ")")
                        .setAuthor(body.user.login, body.user.avatar_url, body.user.html_url)
                        .setDescription(body.body)
                        .setTimestamp(Date.parse(body.created_at));
                    let AdditionalInformations = "";
                    if (body.state !== "open") {
                        AdditionalInformations += ":x: Closed by " + body.closed_by.login + " " + moment(body.closed_at).fromNow() + " (" + moment(body.closed_at).format("D, MMMM YYYY, HH:mm:ss") + " )\n";
                        message.setColor("a30000")
                    } else {
                        AdditionalInformations += ":white_check_mark: Open\n";
                        message.setColor("2b2b2b")
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

    if (msg.channel.id === config.Channel) {

        let m = msg.toString().split(" ")[0].trim();
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

    if (!msg.content.startsWith(config.Prefix))
        return;

    WithoutPrefix = msg.content.replace(config.Prefix, "");
    Command = WithoutPrefix.split(/ +/)[0];
    arguments = WithoutPrefix.split(/ +/).shift().toLowerCase();
    if (Command === Commands.help.input) {
        let response = new Discord.RichEmbed()
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
    } else if (Command === Commands.repository.input) {
        let response = new Discord.RichEmbed()
            .setTitle("Here are the repositories of the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (i in Commands.repository.repository) {
            item = Commands.repository.repository[i];
            response.addField(item.name, item.desc + " (" + item.url + ")")
        }
        msg.channel.send(response);
    } else if (Command === Commands.team.input) {
        let response = new Discord.RichEmbed()
            .setTitle("Here are the people who develop the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        let team = JSON.parse(fs.readFileSync(Commands.team.file));
        team.forEach(element => {
            response.addField(element.name, "Github : " + element.Github + " Discord : " + client.users.find(user => user.id === element.DiscordId).tag)
        });
        msg.channel.send(response);
    } else if (Command === Commands.hug.input) {
        if (!msg.mentions.users.size) {
            msg.reply('Are you alone :( ?')
            return;
        }
        sendHug(msg);
    }
});

async function sendHug(msg) {
    try {
        const user = msg.mentions.users.first();
        const data = await (await fetch('https://nekos.life/api/v2/img/hug')).json();
        if ((!(data || data.url)))
            return msg.channel.send("an error occured");
        let answer = new Discord.RichEmbed()
            .setTitle("@" + user.username + "" + " is hugged by @" + msg.author.username + "")
            .setImage(data.url)
            .addField("Provided by : ", "nekos.life")
        msg.channel.send(answer)
    } catch (e) {
        console.log(e)
        return msg.channel.send("an error occured")
    }
}


ON_DEATH(function (signal, err) {
    console.log("Destroying the bot.");
    client.destroy();
    process.exit();
});

client.login(config.Token);
