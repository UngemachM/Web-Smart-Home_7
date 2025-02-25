import React, { useState } from 'react';
import './RoomConfigurationDetails.css'; // Importiere die CSS-Datei

function RoomConfigurationDetails({ room, devices, onSave, onCancel }) {
  const [selectedDevices, setSelectedDevices] = useState(room.devices || []);
  const [thermostatsSettings, setThermostatsSettings] = useState(
    devices
      .filter(device => device.type === 'thermostat')
      .reduce((acc, device) => ({
        ...acc,
        [device.id]: {
          roomTemp: room.thermostats?.[device.id]?.roomTemp || device.roomTemp || 21,
          absenkTemp: room.thermostats?.[device.id]?.absenkTemp || device.absenkTemp || 17
        }
      }), {})
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedRoom = {
        ...room,
        devices: selectedDevices,
        thermostats: Object.fromEntries(
          Object.entries(thermostatsSettings).map(([id, settings]) => [
            id,
            {
              roomTemp: settings.roomTemp === '' ? 21 : parseFloat(settings.roomTemp),
              absenkTemp: settings.absenkTemp === '' ? 17 : parseFloat(settings.absenkTemp)
            }
          ])
        )
      };
      await onSave(updatedRoom);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container">
      <h1 className="smart-home-title">Smart Home</h1>
      <h2 className="room-edit-title">Raumname Bearbeiten: {room.name}</h2>
      
      <div className="section">
        <h3 className="section-title">Geräte auswählen</h3>
        <div className="device-list">
          {devices.map(device => (
            <label key={device.id} className="device-item">
              <input
                type="checkbox"
                checked={selectedDevices.includes(device.id)}
                onChange={() => {
                  if (selectedDevices.includes(device.id)) {
                    setSelectedDevices(selectedDevices.filter(id => id !== device.id));
                  } else {
                    setSelectedDevices([...selectedDevices, device.id]);
                  }
                }}
                className="device-checkbox"
              />
              <span className="device-type">{device.type}</span>
              <span className="device-id">({device.id})</span>
            </label>
          ))}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">Temperatureinstellungen</h3>
        {devices
          .filter(device => 
            device.type === 'thermostat' && 
            selectedDevices.includes(device.id)
          )
          .map(thermostat => (
            <div key={thermostat.id} className="thermostat-settings">
              <h4 className="thermostat-title">Thermostat: {thermostat.id}</h4>
              <div className="input-group">
                <label className="input-label">
                  Raumtemperatur:
                  <input
                    type="text"
                    value={thermostatsSettings[thermostat.id]?.roomTemp}
                    onChange={(e) => {
                      const value = e.target.value;
                      setThermostatsSettings(prev => ({
                        ...prev,
                        [thermostat.id]: {
                          ...prev[thermostat.id],
                          roomTemp: value
                        }
                      }));
                    }}
                    className="input-field"
                  /> °C
                </label>
                <label className="input-label">
                  Absenktemperatur:
                  <input
                    type="text"
                    value={thermostatsSettings[thermostat.id]?.absenkTemp}
                    onChange={(e) => {
                      const value = e.target.value;
                      setThermostatsSettings(prev => ({
                        ...prev,
                        [thermostat.id]: {
                          ...prev[thermostat.id],
                          absenkTemp: value
                        }
                      }));
                    }}
                    className="input-field"
                  /> °C
                </label>
              </div>
            </div>
          ))}
      </div>

      <div className="button-group">
        <button
          onClick={onCancel}
          className="button button-cancel"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="button button-save"
        >
          {isSaving ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

export default RoomConfigurationDetails;