const fastify = require('fastify')();
const mqtt = require('mqtt');
const { setupRoomRoutes } = require('./room.js');
const { exec } = require('child_process');

fastify.register(require('@fastify/cors'), {
  origin: '*'
});

let registeredDevices = new Map();
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

fastify.register(require('@fastify/formbody'));

fastify.get('/', async (request, reply) => {
  reply.send({ message: "SmartHome-Backend läuft!" });
});

fastify.get('/devices', async (request, reply) => {
  return Array.from(registeredDevices.values());
});

fastify.post('/shutdown', async (request, reply) => {
  try {
    process.exit(0);
    return { success: true };
  } catch (error) {
    reply.code(500).send({ error: 'Fehler beim Herunterfahren' });
  }
});

setupRoomRoutes(fastify);

mqttClient.on('connect', () => {
  console.log('SmartHome mit MQTT verbunden');
  mqttClient.subscribe('smarthome/register');
  mqttClient.subscribe('smarthome/device/+/status'); 
  mqttClient.subscribe('smarthome/updates');
});

mqttClient.on('error', (err) => {
  console.error('MQTT-Verbindungsfehler:', err);
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
        
        console.log(`Temperatur-Update für ${deviceId}:`);
        console.log(`Aktuelle Temperatur: ${statusData.currentTemp}°C`);
        console.log(`Zieltemperatur: ${statusData.targetTemp}°C`);
      } else {
        device.status = statusData.status;
      }
      registeredDevices.set(deviceId, device);
      console.log(`Status für Gerät ${deviceId} aktualisiert:`, device);
    }
  } else if (topic === 'smarthome/updates') {
    try {
      const updateData = JSON.parse(message.toString());
      const deviceId = updateData.id;
      
      if (registeredDevices.has(deviceId)) {
        const device = registeredDevices.get(deviceId);
        
        if (updateData.type === 'thermostat') {
          device.currentTemp = updateData.currentTemp;
          device.targetTemp = updateData.targetTemp;
          console.log(`Temperatur-Update über smarthome/updates für ${deviceId}:`);
          console.log(`Aktuelle Temperatur: ${updateData.currentTemp}°C`);
          console.log(`Zieltemperatur: ${updateData.targetTemp}°C`);
        } else if (updateData.type === 'fensterkontakt') {
          device.status = updateData.status;
          console.log(`Fensterstatus-Update für ${deviceId}: ${updateData.status}`);
        }
        
        registeredDevices.set(deviceId, device);
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten des MQTT-Updates:', error);
    }
  }
});

fastify.post('/thermostats/settings', async (request, reply) => {
  const { thermostats } = request.body;

  if (!thermostats) {
    return reply.code(400).send({ error: 'Thermostat-Einstellungen sind erforderlich' });
  }

  try {
    Object.entries(thermostats).forEach(([deviceId, settings]) => {
      if (registeredDevices.has(deviceId)) {
        const device = registeredDevices.get(deviceId);
        device.targetTemp = settings.roomTemp;
        device.absenkTemp = settings.absenkTemp;
        registeredDevices.set(deviceId, device);

        // Sende die neuen Temperaturen über MQTT
        mqttClient.publish(`smarthome/thermostat/${deviceId}/setTemp`, JSON.stringify({
          roomTemp: settings.roomTemp,
          absenkTemp: settings.absenkTemp
        }));
      }
    });

    return reply.send({ success: true });
  } catch (err) {
    console.error('Fehler beim Aktualisieren der Thermostat-Einstellungen:', err);
    return reply.code(500).send({ error: 'Interner Serverfehler' });
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
  const { deviceId, status, targetTemp } = request.body;
  console.log(request.body)
  
  if (!deviceId || !status) {
    return reply.code(400).send({ error: 'Gerät-ID und Status sind erforderlich' });
  }
  
  try {
    mqttClient.publish(`smarthome/device/${deviceId}/status`, JSON.stringify({
      status: status,
      targetTemp: targetTemp
    }));
    
    return reply.send({ success: true });
  } catch (err) {
    console.error('Fehler beim Ändern des Gerätestatus:', err);
    return reply.code(500).send({ error: 'Interner Serverfehler' });
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