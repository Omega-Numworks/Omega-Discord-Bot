# Omega-Discord-Bot
A bot for our Discord

## How to use
#### Intsallation and setting up
Git clone the repository and go inside Omega-discord-bot repository, and then :
`npm i`

Copy `blank_config.yaml` into a new file named `config.yaml`.

Fill this configuration file, the `Token` field is for the token of your bot. If you haven't one yet, create your app at [Discord developper portal](https://discordapp.com/developers/applications/), create your bot from this app and copy paste the token.

⚠ The bot's secret **is not** the bot's token.

You need to create a file named `customCommands.json` with an empty list (`[]`) as content.

#### Run
`node build/index.js`

## How to build the app

Use `npm run build` to build the typescript app