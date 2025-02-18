import React, { useState } from 'react';
import axios from 'axios';

function RoomItem({ room, devices, onRoomUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState(room.devices || []);
  const [isSaving, setIsSaving] = useState(false);

  const roomDevices = devices.filter(device => 
    room.devices && room.devices.includes(device.id)
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
    </div>
  );
}

export default RoomItem;