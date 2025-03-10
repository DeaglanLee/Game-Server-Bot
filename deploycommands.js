require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const commands = require('./commands');
const { DISCORD_APP_ID, DISCORD_BOT_TOKEN } = process.env;

console.log('DISCORD_APP_ID:', DISCORD_APP_ID);
console.log('DISCORD_BOT_TOKEN:', DISCORD_BOT_TOKEN);

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(DISCORD_APP_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response ? error.response.body : 'No response body');
  }
})();
