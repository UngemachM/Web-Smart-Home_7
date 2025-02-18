const fastify = require('fastify')();
const mqtt = require('mqtt');

// Konfiguration über Umgebungsvariablen
const deviceId = process.env.DEVICE_ID || 'fensterkontakt_1';
const port = process.env.PORT || 3001;
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

mqttClient.on('connect', () => {
  console.log(`Fensterkontakt ${deviceId} mit MQTT verbunden`);
  
  const registrationData = {
    id: deviceId,
    type: 'fensterkontakt',
    status: 'closed'
  };
  
  mqttClient.publish('smarthome/register', JSON.stringify(registrationData));
});

fastify.get('/', async (request, reply) => {
  reply.send({ 
    message: `Fensterkontakt ${deviceId} läuft!`,
    status: 'closed'
  });
});

fastify.listen({ port: port, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Fensterkontakt ${deviceId} Server läuft auf Port ${port}`);
});