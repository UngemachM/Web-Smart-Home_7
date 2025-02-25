const fastify = require('fastify')();
const mqtt = require('mqtt');

// Konfiguration über Umgebungsvariablen
const deviceId = process.env.DEVICE_ID || 'fensterkontakt_1';
const port = process.env.PORT || 3001;
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

// Aktueller Status des Fensters


mqttClient.on('connect', () => {
  console.log(`Fensterkontakt ${deviceId} mit MQTT verbunden`);
  let windowStatus = "open";
  
  
  // Registrierung des Geräts
  const registrationData = {
    id: deviceId,
    type: 'fensterkontakt',
    status: windowStatus
  };
  mqttClient.publish('smarthome/register', JSON.stringify(registrationData));
  
  // Subscribe auf Status-Änderungen für dieses Gerät
  mqttClient.subscribe(`smarthome/device/${deviceId}/status`);
});

// MQTT Message Handler
mqttClient.on('message', (topic, message) => {
  if (topic === `smarthome/device/${deviceId}/status`) {
    try {
      const data = JSON.parse(message.toString());
      if (data.status) {
        windowStatus = data.status;
        console.log(`Fensterstatus geändert auf: ${windowStatus}`);
        console.log(windowStatus);
        
        // Status-Update an alle Clients senden
        mqttClient.publish('smarthome/updates', JSON.stringify({
          id: deviceId,
          type: 'fensterkontakt',
          status: windowStatus
        }));
      }
    } catch (err) {
      console.error('Fehler beim Verarbeiten der MQTT-Nachricht:', err);
    }
  }
});

// HTTP Endpunkte
fastify.get('/', async (request, reply) => {
  reply.send({
    message: `Fensterkontakt ${deviceId} läuft!`,
    status: windowStatus
  });
});


// Server starten
fastify.listen({ port: port, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Fensterkontakt ${deviceId} Server läuft auf Port ${port}`);
});