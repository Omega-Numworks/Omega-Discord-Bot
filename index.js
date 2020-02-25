const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");
const yaml = require("yaml");
const request = require("request")
const moment = require("moment")
var ON_DEATH = require('death');


// CONFIG
var ConfigLocation = "config.yaml"
var config = yaml.parse(fs.readFileSync(ConfigLocation, "utf8"))
var Commands = config.Commands

client.on('ready', () => {
  console.log(`Connected as ${client.user.tag}!`);
});

client.on('message', msg => {
    if(!msg.channel.name.toLowerCase().includes("fr")){
        ForbiddenWordPresent = false;
        config.ForbiddenWords.forEach((item) => {
            if(msg.content.toLowerCase().includes(item)){
                ForbiddenWordPresent = true;
            }
        })
        if(ForbiddenWordPresent){
            msg.channel.send("**FR**\n<@" + msg.author.id + ">, " + config.ForbiddenWordsResponseFR + "\n\n**EN**\n<@" + msg.author.id + ">, " + config.ForbiddenWordsResponseEN);
            return
        }
        config.ShortForbiddenWords.forEach((item) => {
            if(msg.content.toLowerCase().includes(item)){
                ForbiddenWordPresent = true;
            }
        })
        if(ForbiddenWordPresent){
            msg.reply(config.ShortForbiddenWordsResponse);
            return
        }
    }

    IssueNumberPosition = msg.content.indexOf("#")
    if (IssueNumberPosition > -1 && msg[IssueNumberPosition + 1] != "<"){
        if(msg.content.substring(IssueNumberPosition+1).includes(" ")){
            IssueId = msg.content.substring(IssueNumberPosition+1).split(" ")[0]
        } else {
            IssueId = msg.content.substring(IssueNumberPosition+1)
        }

        request({
            url : "https://api.github.com/repos/" + config["Omega-Repository"] + "/issues/" + IssueId,
            headers : {
                'User-Agent' : 'Omega-Discord-Bot'
            }
        }, (error, response, body) => {
            body = JSON.parse(body)
            if(error)
                msg.channel.send("ERROR : " + error.toString())
            if(response.statusCode == 200){
                let message = new Discord.RichEmbed()
                    .setURL(body.html_url)
                    .setTitle(body.title + " (#" + body.number + ")")
                    .setAuthor(body.user.login, body.user.avatar_url, body.user.html_url)
                    .setDescription(body.body)
                    .setTimestamp(Date.parse(body.created_at))
                let AdditionalInformations = ""
                if(body.state !== "open"){
                    AdditionalInformations+=":x: Closed by "+ body.closed_by.login + " " + moment(body.closed_at).fromNow() +" (" + moment(body.closed_at).format("D, MMMM YYYY, HH:mm:ss") +" )\n"
                    message.setColor("a30000")
                }else{
                    AdditionalInformations += ":white_check_mark: Open\n"
                    message.setColor("2b2b2b")
                }
                if(body.labels.length != 0){
                    AdditionalInformations += ":label: Labels : "
                    body.labels.forEach((item, index) => {
                        if(index != 0){
                            AdditionalInformations+= ", "
                        }
                        AdditionalInformations+=item.name 
                    })
                    AdditionalInformations+="\n"
                }
                if(body.assignees.length != 0){
                    AdditionalInformations+=":person_frowning: Assigned to "
                    body.assignees.forEach((item, index) => {
                        if(index != 0){
                            AdditionalInformations += ", "
                        }
                        AdditionalInformations+=item.login
                    })
                    AdditionalInformations+="\n"
                }
                if(body.locked){
                    AdditionalInformations+=":lock: locked\n"
                }
                if(body.pull_request != undefined){
                    AdditionalInformations += ":arrows_clockwise: Pull request\n"
                }
                if(body.comments != 0){
                    AdditionalInformations+=":speech_balloon: Comments : " + body.comments + "\n"
                }
                if(IssueId.toLowerCase() == body.number + "c"){
                    request({
                        url : body.comments_url,
                        headers : {
                            'User-Agent' : 'Omega-Discord-Bot'
                        }
                    },(err, resp, bod) => {
                        bod = JSON.parse(bod)
                        bod.forEach((item) => {
                            message.addField("**Answer of** " + item.user.login + " **" + moment(item.created_at).fromNow() +" (" + moment(item.created_at).format("D, MMMM YYYY, HH:mm:ss") +" )**", item.body)
                        })
                        message.addField("Additional informations", AdditionalInformations)
                            .setFooter(client.user.tag, client.user.avatarURL)
                        msg.channel.send(message)
                    })
                } else {
                    message.addField("Additional informations", AdditionalInformations)
                        .setFooter(client.user.tag, client.user.avatarURL)
                    msg.channel.send(message)
                }

            }
        })
    }

    if(!msg.content.startsWith(config.Prefix))
        return;

    WithoutPrefix = msg.content.replace(config.Prefix, "")
    Command = WithoutPrefix.split(" ")[0]
    if(Command == Commands.help.input){
        let response = new Discord.RichEmbed()
            .setTitle("Here are the commands you can use with me")
            .setThumbnail(client.user.displayAvatarURL)
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for(i in Commands){
            item = Commands[i];
            response.addField(config.Prefix + item.input, item.description)
        }
        msg.channel.send(response);
    } else if(Command == Commands.repository.input){
        let response = new Discord.RichEmbed()
            .setTitle("Here are the repositories of the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        for(i in Commands.repository.repository){
            item = Commands.repository.repository[i];
            response.addField(item.name, item.desc + " (" + item.url + ")")
        }
        msg.channel.send(response);
    } else if(Command == Commands.team.input){
        let response = new Discord.RichEmbed()
            .setTitle("Here are the people who develop the omega project")
            .setTimestamp(new Date())
            .setURL(config.URL)
            .setAuthor(client.user.tag, client.user.displayAvatarURL, config.URL);
        let team = JSON.parse(fs.readFileSync(Commands.team.file))
        team.forEach(element => {
            response.addField(element.name, "Github : " + element.Github + " Discord : " + client.users.find(user => user.id == element.DiscordId).tag)
        });
        msg.channel.send(response);
    }
});

ON_DEATH(function(signal, err) {
    console.log("Destroying the bot.");
    client.destroy();
    process.exit();
})

client.login(config.Token);
