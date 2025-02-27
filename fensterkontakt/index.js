const fastify = require('fastify')();
const mqtt = require('mqtt');
const dbService = require('./db.js');

const deviceId = process.env.DEVICE_ID || 'fensterkontakt_1';
const port = process.env.PORT || 3001;
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

let windowStatus = "closed";

mqttClient.on('connect', () => {
  console.log(`Fensterkontakt ${deviceId} mit MQTT verbunden`);
  const registrationData = {
    id: deviceId,
    type: 'fensterkontakt',
    status: windowStatus
  };
  mqttClient.publish('smarthome/register', JSON.stringify(registrationData));
  mqttClient.subscribe(`smarthome/device/${deviceId}/status`);
});

// In the event handler for MQTT window status
mqttClient.on('message', async (topic, message) => {
  if (topic.startsWith('smarthome/device/') && topic.endsWith('/status')) {
    const deviceId = topic.split('/')[2];
    const statusData = JSON.parse(message.toString());
    try {
      if (statusData.currentTemp !== undefined && statusData.targetTemp !== undefined) {
        // Log to history table
        await dbService.logThermostatStatus(deviceId, statusData.currentTemp, statusData.targetTemp);
        // Update current status in devices table
        await dbService.updateThermostatStatus(deviceId, statusData.currentTemp, statusData.targetTemp);
      } else {
        // Log to history table
        await dbService.logDeviceStatus(deviceId, statusData.status);
        // Update current status in devices table
        await dbService.updateDeviceStatus(deviceId, statusData.status);
      }
    } catch (error) {
      console.error(`Error updating status for device ${deviceId}:`, error);
    }
  }
});


fastify.get('/', async (request, reply) => {
  reply.send({
    message: `Fensterkontakt ${deviceId} läuft!`,
    status: windowStatus
  });
});

fastify.listen({ port: port, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Fensterkontakt ${deviceId} Server läuft auf Port ${port}`);
});