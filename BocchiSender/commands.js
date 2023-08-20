const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9')
const { ApplicationCommandOptionType } = require('discord.js');
const config = require('./config_file.json');

const commands = [
    {
        name: 'register',
        description: 'Register to receive periodic bocchis!',
        options: [
            {
                name: 'frequency',
                description: 'Number of bocchis per day.',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                choices: [
                    { name: '1', value: 1 },
                    { name: '2', value: 2 }
                ]
            },
            {
                name: 'low_quality',
                description: 'Allow low rated art?',
                type: ApplicationCommandOptionType.Boolean,
                required: true
            },
        ],
    },
    // Add more commands here if needed
];


const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(config.client_id, config.guild_id), {
            body: commands,
        });

        console.log('Loaded slash commands.');
    } catch (error) {
        console.error(error);
    }
})();