require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { DISCORD_APP_ID, DISCORD_BOT_TOKEN } = process.env;

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started deleting application (/) commands.');

    // Fetch all commands
    const commands = await rest.get(Routes.applicationCommands(DISCORD_APP_ID));
    
    // Delete each command
    for (const command of commands) {
      await rest.delete(`${Routes.applicationCommands(DISCORD_APP_ID)}/${command.id}`);
      console.log(`Deleted command with ID: ${command.id}`);
    }

    console.log('Successfully deleted all application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();