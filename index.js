const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");
const yaml = require("yaml");
var ON_DEATH = require('death');


// CONFIG
var ConfigLocation = "config.yaml"
var config = yaml.parse(fs.readFileSync(ConfigLocation, "utf8"))
var Commands = config.Commands

client.on('ready', () => {
  console.log(`Connected as ${client.user.tag}!`);
});

client.on('message', msg => {
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

    if(msg.content.includes("mdr" && !msg.channel.name.includes("fr"))){
        msg.reply("In English please!");
    }
});

ON_DEATH(function(signal, err) {
    console.log("Destroying the bot.");
    client.destroy();
    process.exit();
})

client.login(config.Token);