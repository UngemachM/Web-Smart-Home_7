const fastify = require('fastify')();
const mqtt = require('mqtt');

// Konfiguration über Umgebungsvariablen
const deviceId = process.env.DEVICE_ID || 'thermostat_1';
const port = process.env.PORT || 3002;
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

// Aktuelle Temperatureinstellungen
let currentSettings = {
  currentTemp: 20,
  targetTemp: 21,
  absenkTemp: 18 // Beispielwert für die Absenktemperatur
};

mqttClient.on('connect', () => {
  console.log(`Thermostat ${deviceId} mit MQTT verbunden`);
  
  const registrationData = {
    id: deviceId,
    type: 'thermostat',
    currentTemp: currentSettings.currentTemp,
    targetTemp: currentSettings.targetTemp
  };
  
  mqttClient.publish('smarthome/register', JSON.stringify(registrationData));
});

fastify.get('/', async (request, reply) => {
  reply.send({ 
    message: `Thermostat ${deviceId} läuft!`,
    currentTemp: currentSettings.currentTemp,
    targetTemp: currentSettings.targetTemp
  });
});

fastify.listen({ port: port, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Thermostat ${deviceId} Server läuft auf Port ${port}`);
});

mqttClient.subscribe(`smarthome/thermostat/${deviceId}/setTemp`);
mqttClient.subscribe('smarthome/updates'); // Abonnieren der Updates

mqttClient.on('message', (topic, message) => {
  if (topic === `smarthome/thermostat/${deviceId}/setTemp`) {
    try {
      const { roomTemp, absenkTemp } = JSON.parse(message.toString());
      // Temperatureinstellungen speichern
      currentSettings.targetTemp = roomTemp;
      currentSettings.absenkTemp = absenkTemp;
      console.log(`Neue Temperatureinstellungen für ${deviceId}:`, 
        { roomTemp, absenkTemp });
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Temperatureinstellung:', error);
    }
  } else if (topic === 'smarthome/updates') {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'fensterkontakt') {
        // Wenn der Fensterstatus geändert wird, die Temperatur anpassen
        if (data.status === 'closed') {
          // Fenster geschlossen: Zieltemperatur verwenden
          currentSettings.currentTemp = currentSettings.targetTemp;
          console.log(`Fenster geschlossen. Temperatur auf Zieltemperatur gesetzt: ${currentSettings.targetTemp}`);
        } else if (data.status === 'open') {
          // Fenster geöffnet: Absenktemperatur verwenden
          currentSettings.currentTemp = currentSettings.absenkTemp;
          console.log(`Fenster geöffnet. Temperatur auf Absenktemperatur gesetzt: ${currentSettings.absenkTemp}`);
        }
        
        // Aktualisierte Temperatur an alle Clients senden
        mqttClient.publish('smarthome/updates', JSON.stringify({
          id: deviceId,
          type: 'thermostat',
          currentTemp: currentSettings.currentTemp,
          targetTemp: currentSettings.targetTemp
        }));
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten des Fensterstatus-Updates:', error);
    }
  }
});