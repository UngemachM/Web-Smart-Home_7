const fastify = require('fastify')();
const mqtt = require('mqtt');

// Konfiguration über Umgebungsvariablen
const deviceId = process.env.DEVICE_ID || 'thermostat_1';
const port = process.env.PORT || 3002;
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

mqttClient.on('connect', () => {
  console.log(`Thermostat ${deviceId} mit MQTT verbunden`);
  
  const registrationData = {
    id: deviceId,
    type: 'thermostat',
    currentTemp: 20,
    targetTemp: 21
  };
  
  mqttClient.publish('smarthome/register', JSON.stringify(registrationData));
});

fastify.get('/', async (request, reply) => {
  reply.send({ 
    message: `Thermostat ${deviceId} läuft!`,
    currentTemp: 20,
    targetTemp: 21
  });
});

fastify.listen({ port: port, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Thermostat ${deviceId} Server läuft auf Port ${port}`);
});