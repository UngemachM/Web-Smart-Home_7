const fastify = require('fastify')();
const mqtt = require('mqtt');
const { setupRoomRoutes } = require('./room.js');
const { exec } = require('child_process');

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

// Shutdown Endpoint
fastify.post('/shutdown', async (request, reply) => {
  try {
    // Signal senden, dass wir herunterfahren wollen
    process.exit(0);  // Beendet den Node.js Prozess
    return { success: true };
  } catch (error) {
    reply.code(500).send({ error: 'Fehler beim Herunterfahren' });
  }
});

setupRoomRoutes(fastify);

// MQTT Verbindung
mqttClient.on('connect', () => {
  console.log('SmartHome mit MQTT verbunden');
  mqttClient.subscribe('smarthome/register');
});

mqttClient.on('error', (err) => {
  console.error('MQTT-Verbindungsfehler:', err);
});

// Add MQTT subscription for device status updates
mqttClient.on('connect', () => {
  console.log('SmartHome mit MQTT verbunden');
  mqttClient.subscribe('smarthome/register');
  mqttClient.subscribe('smarthome/device/+/status'); // Add this line to listen for all device status changes
});

// Update MQTT message handler to handle status updates
mqttClient.on('message', (topic, message) => {
  if (topic === 'smarthome/register') {
    const device = JSON.parse(message.toString());
    registeredDevices.set(device.id, device);
    console.log('Neues Gerät registriert:', device);
  } else if (topic.startsWith('smarthome/device/') && topic.endsWith('/status')) {
    // Extract device ID from topic (format: smarthome/device/{deviceId}/status)
    const deviceId = topic.split('/')[2];
    const statusData = JSON.parse(message.toString());
    
    // Update device status in our map if the device exists
    if (registeredDevices.has(deviceId)) {
      const device = registeredDevices.get(deviceId);
      device.status = statusData.status;
      registeredDevices.set(deviceId, device);
      console.log(`Status für Gerät ${deviceId} aktualisiert auf: ${statusData.status}`);
    }
  }
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('SmartHome Server läuft auf Port 3000');
});


fastify.post('/device/status', async (request, reply) => {
  const { deviceId, status } = request.body;
  console.log(request.body)
  
  if (!deviceId || !status) {
    return reply.code(400).send({ error: 'Gerät-ID und Status sind erforderlich' });
  }
  
  try {

    
    // Status-Änderung über MQTT veröffentlichen
    mqttClient.publish(`smarthome/device/${deviceId}/status`, JSON.stringify({
      status: status
    }));
    
    // Erfolgsantwort senden
    return reply.send({ success: true });
  } catch (err) {
    console.error('Fehler beim Ändern des Gerätestatus:', err);
    return reply.code(500).send({ error: 'Interner Serverfehler hier' });
  }
});