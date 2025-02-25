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
  mqttClient.subscribe('smarthome/device/+/status'); 
  mqttClient.subscribe('smarthome/updates');

});

mqttClient.on('message', (topic, message) => {
  if (topic === 'smarthome/register') {
    const device = JSON.parse(message.toString());
    registeredDevices.set(device.id, device);
    console.log('Neues Gerät registriert:', device);
  } else if (topic.startsWith('smarthome/device/') && topic.endsWith('/status')) {
    const deviceId = topic.split('/')[2];
    const statusData = JSON.parse(message.toString());

    if (registeredDevices.has(deviceId)) {
      const device = registeredDevices.get(deviceId);
      if (device.type === 'thermostat') {
        device.currentTemp = statusData.currentTemp;
        device.targetTemp = statusData.targetTemp;
        
        // **Hier die neue Konsolenausgabe für Temperatur-Updates**
        console.log(`🔵 Temperatur-Update für ${deviceId}:`);
        console.log(`🌡️ Aktuelle Temperatur: ${statusData.currentTemp}°C`);
        console.log(`🎯 Zieltemperatur: ${statusData.targetTemp}°C`);
      } else {
        device.status = statusData.status;
      }
      registeredDevices.set(deviceId, device);
      console.log(`Status für Gerät ${deviceId} aktualisiert:`, device);
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
fastify.post('/device/thermostat/status', async (request, reply) => {
  const { deviceId, currentTemp, targetTemp } = request.body;
  
  if (!deviceId || currentTemp === undefined || targetTemp === undefined) {
    return reply.code(400).send({ error: 'Gerät-ID, aktuelle Temperatur und Zieltemperatur sind erforderlich' });
  }
  
  try {
    mqttClient.publish(`smarthome/device/${deviceId}/status`, JSON.stringify({
      currentTemp: currentTemp,
      targetTemp: targetTemp
    }));
    
    return reply.send({ success: true });
  } catch (err) {
    console.error('Fehler beim Ändern des Thermostat-Status:', err);
    return reply.code(500).send({ error: 'Interner Serverfehler' });
  }
});