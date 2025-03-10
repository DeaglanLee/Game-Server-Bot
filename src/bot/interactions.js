const { startInstance, runScript, stopInstance, getUserInstancesWithInstanceName, getUserInstances, waitForInstanceToBeRunning, createInstance, getInstanceCost } = require('../aws/ec2');
const { headerMessage, codeBlockMessage, multiLineCodeBlockMessage, italicMessage, blockquoteMessage, multiLineBlockquoteMessage, listMessage, maskedLinks, boldMessage } = require('./messageTypes')
const fs = require('fs');

/**
 * This Makes sure there is data within the instance variable, if there isnt, it edits a reply in the discord message
 * 
 * @param {*} instance  
 * @returns true or false if there is anything in the instance parameter
 */
async function checkDataExists(instance) {
  if (instance.length > 0) {
    return {
      value: true
    }
  }
  return {
    value: false,
    error: "No instance(s) found"
  }
}

/**
 * This Starts an instance and waits for the instance to be running (Status checks to be set to "ok")
 * 
 * @param {*} instance 
 * @param {*} interaction 
 */
async function startInstanceFunction(instance, interaction) {
  try {
    const instanceID = instance[0].instanceId;
    const instanceName = instance[0].instanceName;

    await interaction.editReply(multiLineBlockquoteMessage(`Starting instance: ${instanceName}\nPlease wait up to 5 Minutes.`));

    // start the instance from the ID
    await startInstance(instanceID);

    await interaction.editReply(`Started instance ${boldMessage(instanceName)}.`);

    // wait for the instance to be running and checks to be completed
    // must be done in order to run scripts
    await waitForInstanceToBeRunning(instanceID);
  } catch (error) {
    throw new Error(`Failed to start instance`)
  }
}


/**
 * Starts an instance, waits for it to be fully running 
 * and runs a game server script on the instance. Then updates the discord interaction (message) with the server status.
 * 
 * @async
 * @function startServer
 * @param {*} instance - An array containing the instance details, including the instance ID and name.
 * @param {*} interaction - The interaction object (discord bot) used to communicate with the discord user.
 * 
 * @throws Throws an error if the server fails to start.
 * 
 * @returns {Promise<void>} A promise that resolves when the server has successfully started and the script has been run.
 */
async function startServer(instance, interaction, user) {
  const instanceID = instance[0].instanceId;
  const instanceName = instance[0].instanceName;
  try {
    // start the instance
    await startInstanceFunction(instance, interaction);

    // run the start game servver script
    await runScript(instanceID, 'sudo -u ec2-user server -s');

    // get the instance details again
    instance = await getUserInstancesWithInstanceName(user.id, instanceName, { state: true, ip: true });
    let instanceIP = instance[0].ip;
    let instanceState = instance[0].state;

    // edit the message with the ip and state
    await interaction.editReply(`Starting Server ${instanceName}\nServer IP: ${instanceIP}\nServer Status: ${instanceState}.`);

  } catch (error) {
    throw new Error(`Failed to start server`)
  }
}


/**
 * Stops an instance of a server by first running a shutdown script 
 * and then stopping the instance after a delay.
 * 
 * @async
 * @function stopServer
 * @param {*} instance - An array containing the instance details, including the instance ID and name.
 * @param {*} interaction -The interaction object (discord bot) used to communicate with the discord user.
 * 
 * @throws Throws an error if the server fails to stop.
 * 
 * @returns {Promise<void>} A promise that resolves when the server has successfully stopped.
 */
async function stopServer(instance, interaction, user) {
  const instanceID = instance[0].instanceId;
  const instanceName = instance[0].instanceName;
  try {
    await interaction.editReply(`Stopping Server ${instanceName}\nPlease wait 30 Seconds.`);

    // stop the game server
    await runScript(instanceID, 'sudo -u ec2-user server -e');

    // Stop the instance after it runs the stop script (waiting 30 seconds as most servers would shut down safely by then)
    setTimeout(async () => {
      // stop instance
      await stopInstance(instanceID);

      //get the instance state again
      instance = await getUserInstancesWithInstanceName(user.id, instanceName, { state: true });
      let instanceState = instance[0].state;

      // edit the message with the state
      interaction.editReply(`Stopped Server ${instanceName}\nServer Status: ${instanceState}.`);
    }, 30000);
  } catch (error) {
    throw new Error(`Failed to stop server`);
  }
}


/**
 * This function handles all the interaction of commands, when a user types a command it will go through this function.
 * 
 * @param {*} interaction 
 */
async function handleInteraction(interaction, client) {
  // get all the data i need for later use (user is for discord user ID)
  const { commandName, options, user } = interaction;

  // Start Command Logic
  if (commandName === 'start') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);

    try {
      // get the instance id with the specified Name with the user ID of the user who typed the command
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { instanceID: true, state: true, ip: true })
      
      // Check instance data exists
      let datacheck = await checkDataExists(instance);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }

      let instanceState = instance[0].state;
      let instanceIP = instance[0].ip;

      // check if the instance is running already
      if (instanceState === 'running') {

        await interaction.editReply(`instances with the name of: ${instanceName} is already ${instanceState}\nIP: ${instanceIP}`);
        return;
      }

      // check if the instance is initialising already
      if (instanceState === 'initialising') {
        await interaction.editReply(`instances with the name of: ${instanceName} is ${instanceState}`);
        return;
      }

      // start the instance and game server
      await startServer(instance, interaction, user);
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // Stop Command Logic
  else if (commandName === 'stop') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);
    try {
      // get the instance id with the specified Name with the user ID of the user who typed the command
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { instanceID: true, state: true, ip: true});

      // Check instance data exists
      let datacheck = await checkDataExists(instance);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }

      let instanceState = instance[0].state;

      // check if the instance is Stopped already
      if (instanceState === 'stopped' || instanceState === 'stopping') {
        await interaction.editReply(`instances with the name of: ${boldMessage(instanceName)} is currently ${instanceState}.`);
        return;
      }

      // stop the game server and instance
      await stopServer(instance, interaction, user);
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // Update Command Logic
  else if (commandName === 'update') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);
    try {
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { instanceName: true });

      // Check instance data exists
      let datacheck = await checkDataExists(instance);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }

      let instanceState = instance[0].state;

      // Check that the instance is on
      if (instanceState === `stopped` || instanceState === `stopping`) {
        interaction.editReply(`${instanceName} is currently turned of. Please wait 1 minute and turn it on to update it.`);
        return;
      }

      const instanceID = instance[0].instanceId;

      // Update the game server
      await runScript(instanceID, 'sudo -u ec2-user /usr/local/bin/server -u');
      await interaction.editReply(`instances with the name of: ${instanceName} is cureently being updated.`);
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // Create Command Logic
  else if (commandName === 'create') {
    const instanceName = options.getString('instance');
    const instanceAMI = options.getString(`ami`)
    const instanceType = options.getString('type');
    const ebsVolume = options.getInteger('volume');
    await interaction.reply(`Running command: /${commandName}`);
    try {
      // create the instance
      await createInstance(instanceName, instanceAMI, instanceType, ebsVolume, user.id);

      //get the instance details
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { id: true });
      let instanceID = instance[0].id;

      // read the server.sh file
      const serverFileContents = fs.readFileSync('../ec2instancefiles/server.sh');

      // wait for the instance to be running
      await waitForInstanceToBeRunning(instanceID);

      // update OS
      await runScript(instanceID, `sudo apt upgrade -y`);

      // install the server.sh file, add it to the PATH
      await runScript(instanceID, `sudo -u ec2-user echo ${serverFileContents} > ~/server.sh chmod +x ~/server.sh sudo mv ~/server.sh /usr/local/bin/server`);

      // create the server_config.txt in ~ (home directory of the ec2-user)
      // this file is all the add ons of the server
      await runScript(instanceID, `sudo -u ec2-user echo server=${instanceAMI} > ~/server_config.txt`);

      // get all the things to run the server
      // server -c (create) gets all the things listed in the server_config.txt
      await runScript(instanceID, "server -c");

      // check if they want the server to stay on

    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // Modify Command Logic
  else if (commandName === 'modify') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);

    // user MUST pick at least one of these
    const instanceType = options.getString('type');
    const ebsVolume = options.getInteger('volume');

    if (instanceType.length < 1 && ebsVolume.length < 1) {
      await interaction.reply(`Please pick either an instance type or ebs volume to change.`);
      return;
    }
  }

  // Terminate Command Logic
  else if (commandName === 'terminate') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);

    try {
      // get the instance
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { ip: true, instanceName: true });

      // Check instance data exists
      let datacheck = await checkDataExists(instance);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }

      const instanceIP = instance[0].ip;
      const state = instance[0].state;

      // terminate it
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // ServerStatus Command Logic
  else if (commandName === 'serverstatus') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);

    try {
      // get the instance
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { state: true, ip: true, instanceName: true });
      
      // Check instance data exists
      let datacheck = await checkDataExists(instance);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }
      
      const instanceIP = instance[0].ip;
      const state = instance[0].state;
      // display a different message if the instance is stopped
      if (state === "stopped") {
        // display the status of the instance; name, status
        await interaction.editReply(`${instanceName} is ${state}`);
        return;
      }

      // display the status of the instance; name, status, ip (if applicable)
      await interaction.editReply(`${instanceName} is ${state}\nIP: ${instanceIP}`);
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // Cost Command Logic
  else if (commandName === 'cost') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);

    // get the instance
    let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { instanceID: true });

    // Check instance data exists
    let datacheck = await checkDataExists(instance);
    if (!datacheck.value) {
      await interaction.editReply(blockquoteMessage(datacheck.error));
      return;
    }

    // get the cost of the instance
    try {
      const instanceID = instance[0].instanceId;
      const costData = await getInstanceCost(instanceID);
      await interaction.editReply(`Instance Name: ${instanceName}\nCurrent Month Cost: $${costData.currentMonthCost.toFixed(2)}\nLast Month Cost: $${costData.lastMonthCost.toFixed(2)}\nTotal Cost: $${costData.totalCost.toFixed(2)}`);
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error));
    }

    // display the cost of the instance; name, cost (month), cost (total)

  }

  // CostAll Command Logic
  else if (commandName === 'costall') {
    await interaction.reply(`Running command: /${commandName}`);

    // get all the discord users instances

    // for each instance 
    // display the cost of the instance; name, cost (month), cost (total)

  }

  // List Command Logic
  // used for listing instances
  else if (commandName === 'list') {
    await interaction.reply(`Running command: /${commandName}`);

    try {
      // get the users instances
      let instances = await getUserInstances(user.id, { all: true });
      
      // Check instance data exists
      let datacheck = await checkDataExists(instances);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }

      let message = "";

      // for each instance 
      instances.forEach(instance => {
        const instanceName = headerMessage(`${instance.instanceName}`)
        const instanceType = boldMessage(`Instance Type:`)
        const instanceIP = boldMessage(`Instance IP:`)
        const instanceState = boldMessage(`Instance State:`)
        message += `${instanceName}
        ${instanceType} ${instance.instanceType}
        ${instanceIP} ${instance.ip}
        ${instanceState} ${instance.state}\n\n`;
      });

      // display the instance; name, state, ip (if applicable), cost (current month), cost (overall)
      interaction.editReply(multiLineBlockquoteMessage(message));
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // Info Command Logic
  else if (commandName === 'info') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);

    try {
      // get the instance
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { ip: true, instanceName: true, state: true });
      
      // Check instance data exists
      let datacheck = await checkDataExists(instance);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }
      
      const instanceIP = instance[0].ip;
      const state = instance[0].state;

      const monthlyCost = "";
      const totalCost = "";

      const header = headerMessage(`${instanceName}`);
      const message = `${header}\nState: ${state}\nIP: ${instanceIP}\nMonth Cost: ${monthlyCost}\nTotal Cost: ${totalCost}`;
      // display the instance; name, state, ip (if applicable), cost (current month), cost (overall)
      await interaction.editReply(multiLineBlockquoteMessage(message))
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // IP Command Logic
  else if (commandName === 'ip') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`);

    try {
      // get the instance
      let instance = await getUserInstancesWithInstanceName(user.id, instanceName, { ip: true, instanceName: true, state: true });
      
      // Check instance data exists
      let datacheck = await checkDataExists(instance);
      if (!datacheck.value) {
        await interaction.editReply(blockquoteMessage(datacheck.error));
        return;
      }
      
      const instanceIP = instance[0].ip;
      const state = instance[0].state;
      // display the instance; name, ip
      await interaction.editReply(multiLineBlockquoteMessage(`Instance Name: ${instanceName}\nIP: ${instanceIP}\nState: ${state}`));
    } catch (error) {
      await interaction.editReply(blockquoteMessage(error))
    }
  }

  // Metrics Command Logic
  else if (commandName === 'metrics') {
    const instanceName = options.getString('instance');
    await interaction.reply(`Running command: /${commandName}`)

    // get the instance
    // check it exists
    // get the metrics of the instance
    // display the instance; name, state, ip, CPU usage, RAM usage, network usage.
  }

  // Notify Command Logic
  else if (commandName === 'notify') {
    const subject = options.getString('subject');
    const message = options.getString('message');
    await interaction.reply(`Running command: /${commandName}`);

    try {
      // Fetch the user object for the admin user
      const { ADMIN_DISCORD_ID } = process.env;
      const admin = await client.users.fetch(ADMIN_DISCORD_ID);

      // send a private discord message to the admin
      await admin.send(`${boldMessage(`Subject:`)}\n${subject}\n\n${boldMessage(`Message:`)}\n${message}\n\nFrom: ${user.username}\n${user.id}`);
      await interaction.editReply(blockquoteMessage(`Notification sent to the admin.`));
    } catch (error) {
      console.error('Error sending notification:', error);
      await interaction.editReply(blockquoteMessage(`Failed to send notification.`));
    }
  }
}

module.exports = {
  handleInteraction,
};
