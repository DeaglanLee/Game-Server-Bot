require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { handleInteraction } = require('./src/bot/interactions');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

client.once('ready', () => {
  console.log('Bot is online!');
});


// handle the interaction between user and bot
client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    await handleInteraction(interaction, client);
  }
});

client.login(DISCORD_BOT_TOKEN);
