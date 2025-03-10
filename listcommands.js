require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { DISCORD_APP_ID, DISCORD_BOT_TOKEN } = process.env;

const rest = new REST({ version: '9' }).setToken(DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Fetching application (/) commands.');

    // Fetch all commands
    const commands = await rest.get(Routes.applicationCommands(DISCORD_APP_ID));
    console.log(commands);

    commands.forEach(command => {
      console.log(`Command: ${command.name}, ID: ${command.id}`);
    });
  } catch (error) {
    console.error(error);
  }
})();
