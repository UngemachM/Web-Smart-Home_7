const fastify = require('fastify')();
const mqtt = require('mqtt');
const dbService = require('./db.js');

// CORS aktivieren
fastify.register(require('@fastify/cors'), {
  origin: '*'
});

// MQTT Client
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

fastify.register(require('@fastify/formbody'));

// GET Endpoint für Geräteliste
fastify.get('/devices', async (request, reply) => {
  try {
    const devices = await dbService.getAllDevices();
    return devices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return reply.code(500).send({ error: 'Database error' });
  }
});

// Geräteverlauf abrufen
fastify.get('/device/:id/history', async (request, reply) => {
  const { id } = request.params;
  try {
    const device = await dbService.getDeviceById(id);
    if (!device) {
      return reply.code(404).send({ error: 'Gerät nicht gefunden' });
    }
    if (device.type === 'thermostat') {
      const history = await dbService.getThermostatHistory(id);
      return history;
    } else {
      const history = await dbService.getDeviceHistory(id);
      return history;
    }
  } catch (error) {
    console.error('Error fetching device history:', error);
    return reply.code(500).send({ error: 'Database error' });
  }
});

// Räume abrufen
fastify.get('/rooms', async (request, reply) => {
  try {
    const rooms = await dbService.getAllRooms();
    return rooms;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return reply.code(500).send({ error: 'Database error' });
  }
});
// Raumdetails abrufen
fastify.get('/rooms/:id', async (request, reply) => {
  const { id } = request.params;
  try {
    // Ruft den Raum mit der ID aus der Datenbank ab
    const room = await dbService.getRoomById(id);
    
    if (!room) {
      // Wenn der Raum nicht existiert, wird ein Fehler zurückgegeben
      return reply.code(404).send({ error: 'Raum nicht gefunden' });
    }
    
    // Gibt die Raumdaten zurück
    return room;
  } catch (error) {
    console.error('Fehler beim Abrufen des Raums:', error);
    return reply.code(500).send({ error: 'Datenbankfehler' });
  }
});


fastify.post('/rooms', async (request, reply) => {
  const { name, floor } = request.body;
  if (!name) {
    return reply.code(400).send({ error: 'Name is required' });
  }
  try {
    const room = await dbService.addRoom(name, floor || 1);
    return room;
  } catch (error) {
    console.error('Error adding room:', error);
    return reply.code(500).send({ error: 'Database error' });
  }
});

mqttClient.on('message', async (topic, message) => {
  if (topic === 'smarthome/register') {
    try {
      const device = JSON.parse(message.toString());
      await dbService.registerDevice(device);
      console.log('Neues Gerät registriert oder aktualisiert:', device);
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }
});

// Raum löschen
fastify.delete('/rooms/:id', async (request, reply) => {
  const { id } = request.params;
  try {
    const room = await dbService.deleteRoom(id);
    return room;
  } catch (error) {
    console.error('Error deleting room:', error);
    return reply.code(500).send({ error: 'Database error' });
  }
});

// MQTT-Verbindung
mqttClient.on('connect', () => {
  console.log('SmartHome mit MQTT verbunden');
  mqttClient.subscribe('smarthome/register');
  mqttClient.subscribe('smarthome/device/+/status');
  mqttClient.subscribe('smarthome/updates');
});

mqttClient.on('message', async (topic, message) => {
  if (topic === 'smarthome/register') {
    try {
      const device = JSON.parse(message.toString());
      await dbService.registerDevice(device);
      console.log('Neues Gerät registriert:', device);
    } catch (error) {
      console.error('Error registering device:', error);
    }
  } else if (topic.startsWith('smarthome/device/') && topic.endsWith('/status')) {
    const deviceId = topic.split('/')[2];
    const statusData = JSON.parse(message.toString());
    try {
      if (statusData.currentTemp !== undefined && statusData.targetTemp !== undefined) {
        await dbService.logThermostatStatus(deviceId, statusData.currentTemp, statusData.targetTemp);
      } else {
        await dbService.logDeviceStatus(deviceId, statusData.status);
      }
    } catch (error) {
      console.error(`Error updating status for device ${deviceId}:`, error);
    }
  }
});

// In server.js
// Add this function to load all device statuses and room assignments on startup
async function initializeSystem() {
  try {
    console.log('Initialisiere System...');
    
    // Lade alle Geräte mit ihren Räumen aus der Datenbank
    const devices = await dbService.getAllDevicesWithRooms();
    console.log(`${devices.length} Geräte aus der Datenbank geladen`);
    
    // Lade alle Räume aus der Datenbank
    const rooms = await dbService.getAllRooms();
    console.log(`${rooms.length} Räume aus der Datenbank geladen`);
    
    // Strukturierte Räume erstellen mit ihren zugewiesenen Geräten
    const roomsWithDevices = rooms.map(room => {
      const roomDevices = devices.filter(device => device.room_id === room.id)
        .map(device => device.id);
      
      return {
        ...room,
        devices: roomDevices
      };
    });
    
    // Loge die gefundenen Räume und Geräte
    roomsWithDevices.forEach(room => {
      console.log(`Raum ${room.name} (ID: ${room.id}) hat ${room.devices.length} Geräte`);
    });
    
    // Sende alle Gerätestatus als MQTT-Updates
    devices.forEach(device => {
      if (device.type === 'fensterkontakt' && device.status) {
        mqttClient.publish('smarthome/updates', JSON.stringify({
          id: device.id,
          type: device.type,
          status: device.status
        }));
      } else if (device.type === 'thermostat' && device.current_temp && device.target_temp) {
        mqttClient.publish('smarthome/updates', JSON.stringify({
          id: device.id,
          type: device.type,
          currentTemp: device.current_temp,
          targetTemp: device.target_temp
        }));
      }
    });
    
    console.log('System wurde erfolgreich initialisiert!');
  } catch (error) {
    console.error('Fehler bei der Systeminitialisierung:', error);
  }
}



// Endpunkt zum Zuweisen von Geräten zu einem Raum
fastify.put('/rooms/:id/devices', async (request, reply) => {
  const { id } = request.params; // Raum-ID
  const { deviceIds } = request.body; // Array von Geräte-IDs
  
  if (!deviceIds || !Array.isArray(deviceIds)) {
    return reply.code(400).send({ error: 'deviceIds must be an array' });
  }

  try {
    // Ändere den Raum für jedes Gerät
    for (const deviceId of deviceIds) {
      await dbService.assignDeviceToRoom(deviceId, id); // Raum-ID für jedes Gerät setzen
    }

    return { message: `Geräte wurden dem Raum mit ID ${id} zugewiesen` };
  } catch (error) {
    console.error('Error assigning devices to room:', error);
    return reply.code(500).send({ error: 'Database error' });
  }
});

// Server starten
fastify.listen({ port: 3000, host: '0.0.0.0' }, async (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('SmartHome Server läuft auf Port 3000');
});