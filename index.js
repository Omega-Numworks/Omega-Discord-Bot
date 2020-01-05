const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");
const yaml = require("yaml");


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
    }
});

client.login(config.Token);