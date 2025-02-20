import React, { useState } from 'react';

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
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">{room.name}</h3>
      
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Geräte auswählen:</h4>
        <div className="grid gap-2 max-h-40 overflow-y-auto">
          {devices.map(device => (
            <label key={device.id} className="flex items-center gap-2 text-sm">
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
                className="rounded"
              />
              <span className="capitalize">{device.type}</span>
              <span className="text-gray-500 text-xs">({device.id})</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Temperatureinstellungen:</h4>
        {devices
          .filter(device => 
            device.type === 'thermostat' && 
            selectedDevices.includes(device.id)
          )
          .map(thermostat => (
            <div key={thermostat.id} className="mb-4 p-3 bg-gray-50 rounded">
              <h5 className="font-medium text-sm mb-2">
                Thermostat: {thermostat.id}
              </h5>
              <div className="grid gap-3">
                <label className="text-sm">
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
                    className="ml-2 p-1 border rounded w-20"
                  /> °C
                </label>
                <label className="text-sm">
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
                    className="ml-2 p-1 border rounded w-20"
                  /> °C
                </label>
              </div>
            </div>
          ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isSaving ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}

export default RoomConfigurationDetails;