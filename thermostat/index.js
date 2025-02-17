const fastify = require('fastify')();
const mqtt = require('mqtt');

const deviceId = 'thermostat_1';
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

mqttClient.on('connect', () => {
  console.log('Thermostat mit MQTT verbunden');
  
  const registrationData = {
    id: deviceId,
    type: 'thermostat',
    currentTemp: 20,
    targetTemp: 21
  };
  
  mqttClient.publish('smarthome/register', JSON.stringify(registrationData));
});

// Bestätigung der Registrierung empfangen
mqttClient.subscribe(`smarthome/register/confirm/${deviceId}`);
mqttClient.on('message', (topic, message) => {
  if (topic === `smarthome/register/confirm/${deviceId}`) {
    console.log('Registrierung bestätigt');
  }
});

fastify.get('/', async (request, reply) => {
  reply.send({ message: "Thermostat läuft!" });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Thermostat Server läuft auf Port 3002');
});