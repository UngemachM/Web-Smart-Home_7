const fastify = require('fastify')();
const mqtt = require('mqtt');

const deviceId = 'fensterkontakt_1';
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

mqttClient.on('connect', () => {
  console.log('Fensterkontakt mit MQTT verbunden');
  
  const registrationData = {
    id: deviceId,
    type: 'fensterkontakt',
    status: 'closed'
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
  reply.send({ message: "Fensterkontakt läuft!" });
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Fensterkontakt Server läuft auf Port 3001');
});