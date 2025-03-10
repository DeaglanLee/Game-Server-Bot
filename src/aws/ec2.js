const { EC2Client, RunInstancesCommand, DescribeInstancesCommand, DescribeInstanceStatusCommand, StartInstancesCommand, StopInstancesCommand } = require('@aws-sdk/client-ec2');
const { SSMClient, SendCommandCommand } = require("@aws-sdk/client-ssm");
const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { REGION } = process.env;

// Configure the AWS SDK
const ec2Client = new EC2Client({ region: REGION });
const ssmClient = new SSMClient({ region: REGION });
const costExplorer = new CostExplorerClient({ region: REGION });

/**
 * 
 * @param {*} instanceId 
 */
async function getInstanceCost(instanceId) {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g., '2024-09'
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

  const params = {
    TimePeriod: {
      Start: `${lastMonth}-01`,  // YYYY-MM-DD format
      End: `${currentMonth}-01`
    },
    Granularity: 'MONTHLY',
    Filter: {
      Dimensions: {
        Key: 'RESERVATION_ID',
        Values: [instanceId]
      }
    },
    Metrics: ['UnblendedCost']  // Include the Metrics parameter
  };

  try {
    const command = new GetCostAndUsageCommand(params);
    const data = await costExplorer.send(command);

    let lastMonthCost = 0;
    let currentMonthCost = 0;
    let totalCost = 0;

    data.ResultsByTime.forEach(result => {
      const amount = parseFloat(result.Total.UnblendedCost.Amount);
      totalCost += amount;

      const month = result.TimePeriod.Start.slice(0, 7);
      if (month === lastMonth) {
        lastMonthCost = amount;
      } else if (month === currentMonth) {
        currentMonthCost = amount;
      }
    });

    return {
      currentMonthCost,
      lastMonthCost,
      totalCost
    };
  } catch (error) {
    console.error("Error fetching cost data:", error);
    throw error;
  }
}

/**
 * Get the instance status
 * 
 * @param {*} params 
 * @returns The instance status
 */
async function getInstancesStatus(params) {

  const data = await ec2Client.send(new DescribeInstanceStatusCommand(params));

  return data.InstanceStatuses.map(status => {
    return {
      instanceId: status.InstanceId,
      instanceStatus: status.InstanceStatus.Status,
      systemStatus: status.SystemStatus.Status
    };
  });

}


/**
 * Gets EC2 instances based on the provided parameters.
 *
 * @param {*} params - The parameters to pass to the EC2 `DescribeInstancesCommand` method. 
 *                          This should include filters or other criteria to search for specific instances.
 * @returns {Promise<Array<Object>>} - A promise that resolves to a flattened array of EC2 instance objects.
 */
async function getinstances(params, options = {}) {

  const data = await ec2Client.send(new DescribeInstancesCommand(params));
  const instanceIds = data.Reservations.flatMap(reservation =>
    reservation.Instances.map(instance => instance.InstanceId)
  );

  // Initialize result array

  const results = await Promise.all(data.Reservations.flatMap(reservation =>
    reservation.Instances.map(async (instance) => {
      const result = {};

      // Get the Instance Name
      if (options.instanceName || options.all) {
        const name = instance.Tags.find(tag => tag.Key === `Name`);
        result.instanceName = name ? name.Value : 'Unnamed';
      }

      // Get the Public IP 
      if (options.ip || options.all) {
        result.ip = instance.PublicIpAddress || 'No Public IP';
      }

      // Get the Private IP
      if (options.privateIP || options.all) {
        result.privateIp = instance.PrivateIpAddress || 'No Private IP';
      }

      // Get the Instance ID
      if (options.instanceID || options.all) {
        result.instanceId = instance.InstanceId || 'No Instance ID';
      }

      // Get the Instance Type
      if (options.instanceType || options.all) {
        result.instanceType = instance.InstanceType || 'No Instance Type';
      }

      // Get the Instance State (human readable)
      if (options.state || options.all) {
        result.state = instance.State.Name || 'No State';
      }

      // Get instance status checks if status option is true
      if (options.status || options.all) {
        // Fetch instance status checks
        return getInstancesStatus({ InstanceIds: instanceIds }).then(statuses => {
          const instanceStatus = statuses.find(status => status.instanceId === instance.InstanceId) || {};
          result.instanceStatus = instanceStatus.instanceStatus || 'Unknown';
          result.systemStatus = instanceStatus.systemStatus || 'Unknown';
          return result;
        });
      }

      // Return all details if no specific options are set
      if (Object.keys(result).length === 0) {
        //result.instanceName = name ? name.Value : 'Unnamed';
        result.ip = instance.PublicIpAddress || 'No Public IP';
        result.privateIp = instance.PrivateIpAddress || 'No Private IP';
        result.instanceId = instance.InstanceId || 'No Instance ID';
        result.instanceType = instance.InstanceType || 'No Instance Type';
      }

      return result;
    })
  ));

  return results
}

/**
 * This gets the instance(s) that have the tag key of "DiscordID" with the value of the discordID.
 * 
 * @param {*} discordID - The Discord ID to match against the "DiscordID" tag value within the instances.
 */
async function getUserInstances(discordID, options = {}) {
  const params = {
    Filters: [
      {
        Name: 'tag:DiscordID', Values: [`*${discordID}*`],
      }
    ]
  };

  return getinstances(params, options);
}


/**
 * This gets the instance(s) that have the tag key of "DiscordID" with the value of the discordID and another 
 * key of "Name" with the value of the instance name.
 * 
 * @param {*} discordId - The Discord ID to match against the "DiscordID" tag value within the instances.
 * @param {*} instanceName - The name of the instance(s) to search for.
 */
async function getUserInstancesWithInstanceName(discordID, instanceName, options = {}) {
  const params = {
    Filters: [
      { Name: 'tag:DiscordID', Values: [`*${discordID}*`]},
      { Name: 'tag:Name', Values: [instanceName] }
    ]
  };

  return getinstances(params, options);
}


/**
 * This Starts the specified instance with the instance ID being the one in the parameter
 * 
 * @param {*} instanceID 
 */
async function startInstance(instanceID) {
  const params = { InstanceIds: [instanceID] };
  await ec2Client.send(new StartInstancesCommand(params));
}


/**
 * This Stops the specified instance with the instance ID being the one in the parameter
 * 
 * @param {*} instanceID 
 */
async function stopInstance(instanceId) {
  const params = { InstanceIds: [instanceId] };
  await ec2Client.send(new StopInstancesCommand(params));
}

/**
 * This runs a specified script in the terminal of the specified instance
 * 
 * @param {*} instanceId 
 * @param {*} scriptName 
 */
async function runScript(instanceId, scriptName) {
  const params = {
    DocumentName: 'AWS-RunShellScript',
    Parameters: {
      commands: [`${scriptName}`],
    },
    InstanceIds: [instanceId]
  };

  const command = new SendCommandCommand(params);
  try {
    // Send the command to SSM
    const response = await ssmClient.send(command);
    console.log("Command sent successfully:", response);
  } catch (error) {
    console.error("Error sending command:", error);
  }
}

/**
 * This is for the instance to boot up and status checks to be completed. 
 * It retrys 20 times with a gap of 10 seconds between each retry.
 * 
 * @param {*} instanceId 
 * @returns true when status checks have passed
 */
async function waitForInstanceToBeRunning(instanceId) {
  const maxRetries = 20;
  let retries = 0;

  while (retries < maxRetries) {

    try {
      // Fetch instance information
      const instanceDetails = await getinstances({ InstanceIds: [instanceId] }, { status: true, state: true });

      // Check the state of the instance
      if (instanceDetails.length > 0) {
        const instanceState = instanceDetails[0].state;
        const instanceStatus = instanceDetails[0].instanceStatus
        const systemStatus = instanceDetails[0].systemStatus

        console.log(`\n${retries} Instance status Check: ${instanceStatus}`)
        console.log(`${retries} System status Check: ${systemStatus}`)

        // Check if the instance is running and status checks are all "ok"
        if (instanceState === "running" && instanceStatus === "ok" && systemStatus === "ok") {
          return true; // Instance is running and status checks passed
        }
      }
    } catch (error) {
      console.error("Error fetching instance details:", error);
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
    retries++;
  }

  throw new Error("Instance did not reach 'running' state within the expected time.");
}

async function createInstance(instanceName, ami, type, volume, discordID) {

  let imageID = "";
  // if AMI = Minecraft set the params with the AMI id as: ami-0a2202cf4c36161a1
  if (ami === "minecraft") {
    imageID = "ami-0a2202cf4c36161a1"
  }

  // if AMI = ark set the params with the AMI id as: ami-0c38b837cd80f13bb
  if (ami === "ark") {
    imageID = "ami-0c38b837cd80f13bb"
  }


  const params = {
    minCount: 1,
    maxCount: 1,
    ImageId: imageID,
    InstanceType: type,
    EbsOptimized: false,
    BlockDeviceMappings: [
      {
        DeviceName: '/dev/sda1',
        Ebs: {
          Encrypted: false,
          DeleteOnTermination: true,
          VolumeSize: volume,     // Volume size in GB
          VolumeType: "gp3",
          Throughput: 125
        },
      },
    ],
    TagSpecifications: [
      {
        ResourceType: 'instance',
        Tags: [
          {
            Key: 'Name',
            Value: instanceName,
          },
          {
            Key: "DiscordID",
            Value: discordID
          }
        ],
      },
    ],
  }
}

module.exports = {
  getUserInstances,
  getUserInstancesWithInstanceName,
  startInstance,
  stopInstance,
  runScript,
  waitForInstanceToBeRunning,
  createInstance,
  getInstanceCost,
};