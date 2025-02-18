const fastify = require('fastify')();
const mqtt = require('mqtt');
const { setupRoomRoutes } = require('./room.js');

// CORS aktivieren
fastify.register(require('@fastify/cors'), {
  origin: '*'
});

// Speicher für Geräte
let registeredDevices = new Map();

// MQTT Client
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

fastify.register(require('@fastify/formbody'));

// GET Endpoint für Geräteliste
fastify.get('/', async (request, reply) => {
  reply.send({ message: "SmartHome-Backend läuft!" });
});

fastify.get('/devices', async (request, reply) => {
  return Array.from(registeredDevices.values());
});

setupRoomRoutes(fastify);

// MQTT Verbindung
mqttClient.on('connect', () => {
  console.log('SmartHome mit MQTT verbunden');
  mqttClient.subscribe('smarthome/register');
});

// MQTT Nachrichten verarbeiten
mqttClient.on('message', (topic, message) => {
  const device = JSON.parse(message.toString());
  if (topic === 'smarthome/register') {
    registeredDevices.set(device.id, device);
    console.log('Neues Gerät registriert:', device);
  }
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('SmartHome Server läuft auf Port 3000');
});