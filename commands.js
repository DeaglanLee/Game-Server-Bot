const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = [
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start an instance')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop an instance')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update an instance')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('create')
    .setDescription('Create a new instance')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('ami')
        .setDescription('Which game do you want the server for? If its not in this list do /notify <message>')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The type of the instance')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('volume')
        .setDescription('The EBS storage volume size (number, eg. 12 for 12GB)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('modify')
    .setDescription('modify an existing instance')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true))
    .addStringOption(option =>
      // change to a choice menu with; Name, Instance Type, 
      option.setName('ami')
        .setDescription('Which game do you want the server for? If its not in this list do /notify <message>')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The type of the instance')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('volume')
        .setDescription('The EBS storage volume size (number, eg. 12 for 12GB)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('notify')
    .setDescription('Notify the Admin for a ')
    .addStringOption(option =>
      option.setName('subject')
        .setDescription('What is the Message about?')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('What do you want to tell the Admins about? (in detail please)')
        .setRequired(true)),
        
  new SlashCommandBuilder()
    .setName('serverstatus')
    .setDescription('check the status of the server')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('cost')
    .setDescription('Check how much the server is costing you this month so far')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('costall')
    .setDescription('Check how much all the servers are costing you this month so far'),

  new SlashCommandBuilder()
    .setName('list')
    .setDescription('list all of your instances'),

  new SlashCommandBuilder()
    .setName('terminate')
    .setDescription('Terminate an instance (this terminates the server aswell)')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get the information of an Instance')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('ip')
    .setDescription('Get the IP of an Server')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('metrics')
    .setDescription('Get the metrics of the server (CPU Usage, Ram Usage, Network Usage)')
    .addStringOption(option =>
      option.setName('instance')
        .setDescription('The name of the instance')
        .setRequired(true)),

].map(command => command.toJSON());
