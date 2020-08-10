import { Client, RichEmbed, Message, ClientVoiceManager } from 'discord.js';
const client = new Client();

import fs from 'fs'
import axios from "axios";

// @ts-ignore
import yaml from 'yaml';

import moment from "moment";
const owoifier = require('@zuzak/owo');

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
    const file = fs.readFileSync("customCommands.json", "utf8")
    const commandList = JSON.parse(file);
    const commandMap: Map<string, { name: string, action: string }> = new Map();
    commandList.forEach((command: { name: string; action: string; }) => {
        commandMap.set(command.name, command)
    })
    
    return commandMap;
}

client.on('ready', () => {
    console.log(`Connected as ${client.user.tag}!`);
});

interface contributor {
    name: string,
    Github: string,
    role: string,
    DiscordId: string
}

/* Github message handler */
client.on('message', async (message: Message) => {
    
    if (message.author.bot) return
    const messageContent = message.content

    const issuePosition: number = messageContent.indexOf("#");

    if (issuePosition === -1 || messageContent[issuePosition + 1] === "<") return

    const issueID = messageContent.substring(issuePosition + 1).split(" ")[0]

    let index = issuePosition + issueID.length

    if (messageContent.charAt(issuePosition - 1) === "<" && messageContent.charAt(index) === ">") return

    const link = issueID.charAt(issueID.length - 1) === 'e' ? config["Numworks-Repository"] : config["Omega-Repository"];



    interface githubResponse {
        title: string,
        html_url: string,
        number: number,
        body: string,
        created_at: string,
        closed_at: string,
        comments_url: string,
        state: string,
        user: {
            login: string,
            avatar_url: string,
            html_url: string
        },
        labels: Array<{
            name: string
        }>,
        assignees: Array<{
            login: string
        }>,
        locked: boolean,
        comments: number,
        pull_request: undefined,
        closed_by: {
            login: string
        }
    }

    interface githubComment {
        user: any,
        created_at: any,
        body: any
    }


    const { status, data }: { status: number, data: githubResponse } = (await axios.get(`https://api.github.com/repos/${link}/issues/${issueID}`))
    if (status === 404) return message.channel.send("Erreur lors de la requête (404)");


    const { html_url, title, number, body, created_at, closed_at, closed_by, assignees, comments, locked, pull_request, state, comments_url, user, labels } = data

    const embed = new RichEmbed()
        .setURL(html_url)
        .setTitle(`${title} (#${number})`)
        .setAuthor(user.login, user.avatar_url, user.html_url)
        .setDescription(body)
        .setTimestamp(Date.parse(created_at));

    const AdditionalInformations = [];

    if (state !== "open") {
        AdditionalInformations.push(`:x: Closed by ${closed_by.login} ${moment(closed_at).fromNow()} (${moment(closed_at).format("D, MMMM YYYY, HH:mm:ss")})`)
        embed.setColor("a30000")
    } else {
        AdditionalInformations.push(":white_check_mark: Open")
        embed.setColor("2b2b2b")
    }

    if (labels.length !== 0) {
        const labelsMap = labels.map(item => item.name)
        AdditionalInformations.push(`:label: Labels : ${labelsMap.join(', ')}`)
    }

    if (assignees.length) {
        const assignMap = assignees.map(item => item.login)
        AdditionalInformations.push(`:person_frowning: Assigned to ${assignMap.join(', ')}`)
    }

    if (locked) AdditionalInformations.push(":lock: locked")
    if (pull_request) AdditionalInformations.push(":arrows_clockwise: Pull request")
    if (comments !== 0) AdditionalInformations.push(`:speech_balloon: Comments : ${comments}`)

    if (issueID.toLowerCase() === number + "c") {
        const data = (await axios.get(comments_url)).data as Array<githubComment>

        data.forEach((item) => {
            embed.addField(`**Answer of**${item.user.login}** ${moment(item.created_at).fromNow()} (${moment(item.created_at).format("D, MMMM YYYY, HH:mm:ss")})**`, item.body)
        });
    }

    embed.addField("Additional informations", AdditionalInformations.join('\n'))
        .setFooter(client.user.tag, client.user.avatarURL);

    message.channel.send(embed)
})


/* Commands message handler */
client.on('message', async (message: Message) => {
    if(message.author.bot) return
    const messageContent = message.content

    if (messageContent.toLowerCase() === "good bot") return message.reply("Good human!");
    if (messageContent.toLowerCase() === "bad bot") return message.reply("Sorry :(");

    for (let forbidden of forbiddenList) {
        if (messageContent.toLowerCase().includes(forbidden)) {
            return message.channel.send(chiffrer);
        }
    }


    /* Config Channel (TODO) */

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
            message.delete(0).catch(reason => console.log("The Message was already destroyed"))
        }, durationComplete)

    }

    /* Commands */


    if (!messageContent.startsWith(config.Prefix)) return

    const [command, ...args] = messageContent.slice(config.Prefix.length).toLowerCase().trim().split(/\s+/)

    if (command === Commands.help.input) {
        const response = new RichEmbed()
            .setTitle("Here are the commands you can use with me")
            .setThumbnail(client.user.displayAvatarURL)
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (const command of Object.values(Commands)) {
            // @ts-ignore
            response.addField(config.Prefix + command.input, command.description)
        }
        message.channel.send(response);
        return;
    } else if (command === Commands.repository.input) {
        const response = new RichEmbed()
            .setTitle("Here are the repositories of the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for (const repository of Commands.repository.repositories) {
            response.addField(repository.name, `${repository.desc} (${repository.url})`)
        }
        message.channel.send(response);
        return;
    } else if (command === Commands.team.input) {
        const response = new RichEmbed()
            .setTitle("Here are the people who develop the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        const team: Array<contributor> = await JSON.parse(fs.readFileSync("team.json", "utf8"))
        team.forEach(element => {
            response.addField(element.name, `Role : ${element.role} \n Github : ${element.Github} \n Discord : ${client.users.get(element.DiscordId)?.tag}`, true)
        });
        message.channel.send(response);
        return;

    } else if (command === Commands.apod.input) {
        let argsMessage = args.join(' ')
        if (!moment(argsMessage, "YYYY-MM-DD").isValid()) {
            argsMessage = "";
        }
        if (!argsMessage.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/)) {
            argsMessage = "";
        }
        let s = moment(argsMessage, "YYYY-MM-DD");
        if (s.isAfter(moment.now())) argsMessage = "";
        if (s.isBefore(moment("1995-06-17"))) argsMessage = "";

        const embed = await getEmbedApod(message, argsMessage);
        return message.channel.send(embed)

    } else if (command === "reload") {
        customCommandMap = loadCommandsFromStorage();
        message.reply("The command list was reloaded")
        return;

    } else if (command === "custom") {
        if (!(message.author.id === "339132422946029569" || message.author.id === "171318796433227776" || message.author.id === "338625981529063425")) {
            message.reply("You do not have the permission to perform this command!");
            return;
        }
        
        const [subcommand, cmd, ...action] = args
        if (subcommand === "set") {
            const actionString: string = action.join(" ");
            
            if (cmd === "" || actionString === "") {
                return message.reply("You can't create an empty command!")
            }
            
            let command = {
                "name": cmd,
                "action": actionString
            }

            if (customCommandMap.has(cmd)) {
                return message.reply("This command already exist."); 
            }

            customCommandMap.set(cmd, command);
            message.reply(`You successfully registered the ${cmd} command`)
        
        } else if (subcommand === "remove") {
            if (!customCommandMap.has(cmd)) return message.reply("This command does not exist.")
            
            customCommandMap.delete(cmd);
            message.reply(`You successfully removed the ${cmd} command`)
        } else {
            const response = new RichEmbed()
                .setTitle("Custom Command Help")
                .setThumbnail(client.user.displayAvatarURL)
                .setTimestamp(new Date())
                .setURL(config.URL)
                .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL)
                .addField("!custom set [cmd] [action]", "Create a command")
                .addField("!custom remove [cmd]", "Remove a custom command")
            message.channel.send(response);
        }
        return saveCustomCommands()
    } else if (command === Commands.customs.input) {
        const response = new RichEmbed()
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

    /* Guild Commands */
    /* hug,
       kiss,
       cuddle,
       pat,
       waifu,
       feed,
       owo,
       fact,
       kemonomimi,
       corona,
       egg,
       drunk,
       compat
    */

    if (message.guild.id !== config.fun_server_id) return notAllowed(message)

    if (customCommandMap.has(command)) {
        message.channel.send(customCommandMap.get(command)?.action);
    } else if (command === Commands.hug.input) {
        if (!message.mentions.users.size) return message.reply('Are you alone :( ?')
        return sendInteraction(message, "hug", "hugged");
    } else if (command === Commands.kiss.input) {
        if (!message.mentions.users.size) return message.reply('Are you alone :( ?')
        return sendInteraction(message, "kiss", "kissed");
    } else if (command === Commands.cuddle.input) {

        if (!message.mentions.users.size) return message.reply('Are you alone :( ?')
        return sendInteraction(message, "cuddle", "cuddled");

    } else if (command === Commands.pat.input) {
        if (!message.mentions.users.size) return message.reply('Are you alone :( ?')
        return sendInteraction(message, "pat", "head-patted");
    } else if (command === Commands.waifu.input) {

        return sendImage(message, "waifu", "waifu");
    } else if (command === Commands.feed.input) {
        if (!message.mentions.users.size) return message.reply('Are you alone :( ?')
        return sendInteraction(message, "feed", "fed");
    } else if (command === Commands.owo.input) {

        if (args.length === 0) return message.reply("Send a text :) !");
        const owoifyMessage = await owoify(message, args.join(' '));
        message.reply(owoifyMessage)

    } else if (command === Commands.fact.input) {
        const fact = await getFact(message);
        message.reply(`Fun fact : ${fact}`)
    } else if (command === Commands.kemonomimi.input) {
        return sendImage(message, "kemonomimi", "picture");
    } else if (command === Commands.corona.input) {

        const user = args.join(' ') || message.author.username

        const random = Math.floor(Math.random() * 101);
        const answer = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("SRAS-CoV-2 Diagnostic Machine")
            .setDescription(`The probability that **${user}** has the SRAS-CoV-2 is **${random}%**`)
            .setTimestamp()

        message.channel.send(answer);

    } else if (command === Commands.egg.input) {
        const user = args.join(' ') || message.author.username

        const random = user.toLowerCase() === "quentin" || user.toLowerCase() === "téia" ? 100 : Math.floor(Math.random() * 101);
        const base = "My Magic Told Me That... **";

        const end = random > 50 ? "** is an egg!" : "** isnt an egg!";

        const answer = `${base}${user}${end}`

        const embed = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("Egginator")
            .setDescription(answer)
            .setTimestamp()
        message.channel.send(embed);
    } else if (command === Commands.drunk.input) {
        const user = args.join(' ') || message.author.username


        const random = user.toLowerCase() === "legmask" ? 100 : Math.floor(Math.random() * 101);
        
        const base = "My Magic Told Me That... **";
        const end = random > 50 ? "** is drunk!" : "** isnt drunk!";
        const answer = `${base}${user}${end}`

        const embed = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("Hips!")
            .setDescription(answer)
            .setTimestamp()
        message.channel.send(embed);
    } else if (command === Commands.compatibility.input) {
        if (args.length < 2) {
            return message.reply("You need 2 persons to do so!");
        }

        if (args.length > 2) {
            return message.reply("Oh! Naughty you! Only 2 please ;)")
        }

        const random = Math.floor(Math.random() * 101);
        const answer = new RichEmbed()
            .setColor("#0099ff")
            .setTitle("Love Calculator")
            .setDescription(`**${args[0]}** and **${args[1]}** are.... **${random}%** compatible`)
            .setTimestamp()
        message.channel.send(answer)
    } 

});

function saveCustomCommands() {
    const list = [];
    for (const key of customCommandMap.keys()) {
        list.push(customCommandMap.get(key));
    }
    fs.writeFileSync("customCommands.json", JSON.stringify(list), "utf8");
}

async function sendInteraction(message: Message, action: string, verb: string) {
    try {
        const user = message.mentions.users.first();
        if (!user) return message.channel.send("Merci de préciser un utilisateur")

        const url = await getNekoImageURL(action)
        if (!url) return message.channel.send("an error occured");

        const answer = new RichEmbed()
            .setTitle(`@${user.username} is ${verb} by @${message.author.username}`)
            .setImage(url)
            .addField("Provided by : ", "nekos.life")

        message.channel.send(answer)
    } catch (e) {
        console.log(e)
        return message.channel.send("an error occured")
    }
}

async function getNekoImageURL(action: string): Promise<string> {
    const { data: { url } } = await axios.get(`https://nekos.life/api/v2/img/${action}`);
    return url
}

async function sendImage(message: Message, action: string, text: string) {
    try {
        const url = await getNekoImageURL(action)
        if (!url) return message.channel.send("an error occured");
        let answer = new RichEmbed()
            .setTitle("Here is your " + text)
            .setImage(url)
            .addField("Provided by : ", "nekos.life")
        message.channel.send(answer)
    } catch (e) {
        console.log(e)
        return message.channel.send("an error occured")
    }
}

async function owoify(message: Message, text: string) {
    return owoifier.translate(text);
}

async function getFact(message: Message) {
    const { data: { fact } } = await axios.get('https://nekos.life/api/v2/fact');
    if (!fact) return message.channel.send("an error occured");

    return fact
}

async function getEmbedApod(message: Message, date: string = "") {

    let link = `https://api.nasa.gov/planetary/apod?api_key=${nasa}${`&date=${date.trim()}`}`;
    const { data: { url, copyright, explanation } } = await axios.get(link);
    if (!url) return message.channel.send("an error occured");

    const answer = new RichEmbed()
        .setTitle("NASA Astronomy Picture of the Day")
        .setAuthor(copyright)
        .setImage(url)
        .setDescription(explanation);

    return answer
}

function notAllowed(message: Message) {
    message.reply("Fun commands are not allowed on this server, go to https://discord.gg/rm85hDH")
}

client.login(config.Token);