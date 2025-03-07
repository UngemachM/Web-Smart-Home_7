const fastify = require('fastify')();
const mqtt = require('mqtt');

const deviceId = process.env.DEVICE_ID || 'thermostat_1';
const port = process.env.PORT || 3002;
const mqttClient = mqtt.connect('mqtt://mosquitto:1883');

let currentSettings = {
  currentTemp: 21,
  targetTemp: 21,
  absenkTemp: 17
};

mqttClient.on('connect', () => {
  console.log(`Thermostat ${deviceId} mit MQTT verbunden`);
  
  const registrationData = {
    id: deviceId,
    type: 'thermostat',
    currentTemp: currentSettings.currentTemp,
    targetTemp: currentSettings.targetTemp,
    absenkTemp: currentSettings.absenkTemp
  };
  
  mqttClient.publish('smarthome/register', JSON.stringify(registrationData));
});

fastify.get('/', async (request, reply) => {
  reply.send({ 
    message: `Thermostat ${deviceId} läuft!`,
    currentTemp: currentSettings.currentTemp,
    targetTemp: currentSettings.targetTemp,
    absenkTemp: currentSettings.absenkTemp
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
mqttClient.subscribe('smarthome/updates');

mqttClient.on('message', (topic, message) => {
  if (topic === `smarthome/thermostat/${deviceId}/setTemp`) {
    try {
      const { roomTemp, absenkTemp } = JSON.parse(message.toString());
      currentSettings.targetTemp = roomTemp;
      currentSettings.absenkTemp = absenkTemp;
      console.log(`Neue Temperatureinstellungen für ${deviceId}:`, 
        { roomTemp, absenkTemp });

      // Sende die aktualisierten Einstellungen an das Frontend
      mqttClient.publish('smarthome/updates', JSON.stringify({
        id: deviceId,
        type: 'thermostat',
        currentTemp: currentSettings.currentTemp,
        targetTemp: currentSettings.targetTemp,
        absenkTemp: currentSettings.absenkTemp
      }));
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Temperatureinstellung:', error);
    }
  } else if (topic === 'smarthome/updates') {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'fensterkontakt') {
        if (data.status === 'closed') {
          currentSettings.currentTemp = currentSettings.targetTemp;
          console.log(`Fenster geschlossen. Temperatur auf Zieltemperatur gesetzt: ${currentSettings.targetTemp}`);
        } else if (data.status === 'open') {
          currentSettings.currentTemp = currentSettings.absenkTemp;
          console.log(`Fenster geöffnet. Temperatur auf Absenktemperatur gesetzt: ${currentSettings.absenkTemp}`);
        }
        
        // Sende die aktualisierte Temperatur an das Frontend
        mqttClient.publish('smarthome/updates', JSON.stringify({
          id: deviceId,
          type: 'thermostat',
          currentTemp: currentSettings.currentTemp,
          targetTemp: currentSettings.targetTemp,
          absenkTemp: currentSettings.absenkTemp
        }));
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten des Fensterstatus-Updates:', error);
    }
  }
});