const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");
const yaml = require("yaml");
var ON_DEATH = require('death');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');


// CONFIG
var ConfigLocation = "config.yaml"
var config = yaml.parse(fs.readFileSync(ConfigLocation, "utf8"))
var Commands = config.Commands
const youtube = new YouTube(config.GoogleApiKey);
const queue = new Map();


client.on('ready', () => {
  console.log(`Connected as ${client.user.tag}!`);
  client.user.setPresence({
    game: { 
        name: config.Status,
        type: 'WATCHING'
    },
    status: 'idle'
    });
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


    if(!msg.content.startsWith(config.Prefix))
        return;

    //WithoutPrefix = msg.content.replace(config.Prefix, "")
    //Command = WithoutPrefix.split(" ")[0]

    const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let Command = msg.content.toLowerCase().split(' ')[0];
	Command = Command.slice(config.Prefix.length)

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
        
    }else if (command === Commands.play.input) {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
		if (!permissions.has('SPEAK')) return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');
		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					let index = 0;
					msg.channel.send(`
__**Song selection:**__

${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`);
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('No or invalid value entered, cancelling video selection.');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('🆘 I could not obtain any search results.');
				}
			}
			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === Commands.skip.input) {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
		if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.');
		serverQueue.connection.dispatcher.end('Skip command has been used!');
		console.log("skip");
		return undefined;
	} else if (command === Commands.stop.input) {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
		if (!serverQueue) return msg.channel.send('There is nothing playing that I could stop for you.');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('Stop command has been used!');
		console.log("pause");
		return undefined;
	} else if (command === Commands.volume.input) {
		if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!');
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		if (!args[1]) return msg.channel.send(`The current volume is: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		return msg.channel.send(`I set the volume to: **${args[1]}**`);
	} else if (command === Commands.nowplaying.input) {
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		return msg.channel.send(`🎶 Now playing: **${serverQueue.songs[0].title}**`);
	} else if (command === Commands.queue.input) {
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		let tosend = [];
		serverQueue.songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} `);}); //- Requested by: ${song.requester}
		msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
	} else if (command === Commands.pause.input) {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			client.user.setPresence({
				game: { 
					name: config.Status,
					type: 'WATCHING'
				},
				status: 'idle'
				});
			return msg.channel.send('⏸ Paused the music for you!');
		}
		return msg.channel.send('There is nothing playing.');
	} else if (command === Commands.resume.input) {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			client.user.setPresence({
				game: { 
					name: song.title,
					type: 'LISTENING'
				},
				status: 'online'
				})
			return msg.channel.send('▶ Resumed the music for you!');
		}
		return msg.channel.send('There is nothing playing.');
	}

});

ON_DEATH(function(signal, err) {
    console.log("Destroying the bot.");
    client.destroy();
    process.exit();
})

client.login(config.Token);

////////////////////////////////////////////////////////////////
///////////////////////////Fonction/////////////////////////////
////////////////////////////////////////////////////////////////

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Discord.Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`I could not join the voice channel: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist){console.log("playlist"); return undefined;}
		else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`);
	}
	console.log("handle video hover")
	return undefined;
}


function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		client.user.setPresence({
			game: { 
				name: config.Status,
				type: 'WATCHING'
			},
			status: 'idle'
			});
		return;
	}
	console.log(serverQueue.songs);
	const stream = ytdl(song.url, { filter: 'audioonly' });
    const dispatcher = serverQueue.connection.playStream(stream)
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`);
	client.user.setPresence({
		game: { 
			name: song.title,
			type: 'LISTENING'
		},
		status: 'online'
		})
}