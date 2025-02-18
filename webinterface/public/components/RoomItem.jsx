import React, { useState } from 'react';
import axios from 'axios';

function RoomItem({ room, devices, onRoomUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState(room.devices || []);
  const [isSaving, setIsSaving] = useState(false);
  const [roomTemp, setRoomTemp] = useState(room.roomTemperature || 21);
  const [absenkTemp, setAbsenkTemp] = useState(17);
  const [isEditingTemp, setIsEditingTemp] = useState(false);

  const roomDevices = devices.filter(device => 
    room.devices && room.devices.includes(device.id)
  );

  const thermostatsInRoom = devices.filter(
    device => room.devices && room.devices.includes(device.id) && device.type === 'thermostat'
  );

  const handleToggleDevice = (deviceId) => {
    if (selectedDevices.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    } else {
      setSelectedDevices([...selectedDevices, deviceId]);
    }
  };

  const handleSaveDevices = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(`http://localhost:3000/rooms/${room.id}/devices`, {
        deviceIds: selectedDevices
      });
      onRoomUpdated(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Fehler beim Speichern der Geräte:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemperatureSubmit = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(
        `http://localhost:3000/rooms/${room.id}/temperature`,
        {
          roomTemp: parseFloat(roomTemp),
          absenkTemp: parseFloat(absenkTemp)
        }
      );
      onRoomUpdated(response.data);
      setIsEditingTemp(false);
    } catch (error) {
      console.error('Fehler beim Speichern der Temperatur:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold">{room.name}</h3>
      
      <div className="mt-3">
        <h4 className="text-md font-medium">Geräte in diesem Raum:</h4>
        {roomDevices.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Geräte zugewiesen</p>
        ) : (
          <ul className="mt-2 text-sm space-y-1">
            {roomDevices.map(device => (
              <li key={device.id} className="flex items-center gap-2">
                <span className="capitalize">{device.type}</span>
                <span className="text-gray-500 text-xs">({device.id})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {isEditing ? (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Geräte auswählen:</h4>
          <div className="grid gap-2 max-h-40 overflow-y-auto">
            {devices.map(device => (
              <label key={device.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(device.id)}
                  onChange={() => handleToggleDevice(device.id)}
                  className="rounded"
                />
                <span className="capitalize">{device.type}</span>
                <span className="text-gray-500 text-xs">({device.id})</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSaveDevices}
              disabled={isSaving}
              className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 disabled:bg-green-300"
            >
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedDevices(room.devices || []);
              }}
              className="border px-3 py-1 text-sm rounded hover:bg-gray-100"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-3 text-blue-500 text-sm hover:text-blue-700"
        >
          Geräte bearbeiten
        </button>
      )}

      {/* Temperatureinstellungen */}
      {thermostatsInRoom.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-md font-medium mb-2">Temperatureinstellungen</h4>
          {isEditingTemp ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm">
                  Raumtemperatur:
                  <input
                    type="number"
                    value={roomTemp}
                    onChange={(e) => setRoomTemp(e.target.value)}
                    className="ml-2 p-1 border rounded w-20"
                    step="0.5"
                    min="5"
                    max="30"
                  /> °C
                </label>
                
                <label className="text-sm">
                  Absenktemperatur:
                  <input
                    type="number"
                    value={absenkTemp}
                    onChange={(e) => setAbsenkTemp(e.target.value)}
                    className="ml-2 p-1 border rounded w-20"
                    step="0.5"
                    min="5"
                    max="30"
                  /> °C
                </label>
              </div>

              <div className="flex gap-2">
                {/* <button
                  onClick={handleTemperatureSubmit}
                  disabled={isSaving}
                  className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600 disabled:bg-green-300"
                >
                  {isSaving ? 'Wird gespeichert...' : 'Temperatur speichern'}
                </button> */}
                <button
                  onClick={() => setIsEditingTemp(false)}
                  className="border px-3 py-1 text-sm rounded hover:bg-gray-100"
                >
                  Speichern
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm">Aktuelle Einstellungen:</p>
              <p className="text-sm text-gray-600">Raumtemperatur: {roomTemp}°C</p>
              <p className="text-sm text-gray-600">Absenktemperatur: {absenkTemp}°C</p>
              <button
                onClick={() => setIsEditingTemp(true)}
                className="mt-2 text-blue-500 text-sm hover:text-blue-700"
              >
                Temperatur bearbeiten
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RoomItem;