const { Client, IntentsBitField, AttachmentBuilder, EmbedBuilder } = require("discord.js");
const path = require('path');
const fs = require('fs');
const config = require('./config_file.json');
const { Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/*

URL encoding sometimes is messed up. Will look into.

TO-DO: 
    PIXIV: Maybe remove bad tags (manga, nsfw)

    REDDIT: 
        Reddit Scraping? IDK API at least might exist ._. 

    GENERAL STUFF:

        Random timing of messages throughout day. 

        Keep a backlog of stuff that's alr been seen ? (Shouldn't really matter) 

        Functionality of specify what you tag you want sent.
    
    */

//init client 
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on("ready", () => {
    console.log("Bot ready...");
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, user } = interaction;

    if (commandName === 'register') {
        const num_bocchis = interaction.options.get('frequency');
        const low_qual = interaction.options.get('low_quality');
        console.log(num_bocchis);
        console.log(low_qual);
        try {
            const data = {
                userId: user.id,
                username: user.username,
                frequency: num_bocchis,
                low_quality: low_qual
            }

            console.log("DATA HTML: ");
            console.log(data);

            fs.writeFileSync(`registered_users/${user.id}.json`, JSON.stringify(data, null, 2));

            await interaction.reply({ content: 'Registered!', ephemeral: true });
        } catch (error) {
            console.error('Error sending DM:', error);
            await interaction.reply({ content: 'Error in registration. : (', ephemeral: true });
        }


    }
});

client.login(config.token);

module.exports = client;