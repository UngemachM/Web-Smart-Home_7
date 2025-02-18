import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoomManager from './components/RoomManager';

function App() {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get('http://localhost:3000/devices');
        // Sortiere die Geräte nach ID
        const sortedDevices = response.data.sort((a, b) => {
          const aNum = parseInt(a.id.split('_')[1]);
          const bNum = parseInt(b.id.split('_')[1]);
         
          // Sortiere erst nach Typ (fensterkontakt vor thermostat)
          if (a.type !== b.type) {
            return a.type === 'fensterkontakt' ? -1 : 1;  // Fensterkontakt zuerst
          }
         
          // Wenn gleicher Typ, sortiere nach Nummer
          return aNum - bNum;
        });
       
        setDevices(sortedDevices);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Abrufen der Geräte:', err);
        setError('Fehler beim Laden der Geräte');
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  // JSX Rendering in einer Variable speichern
  const devicesList = devices.length === 0 ? (
    <p>Noch keine Geräte registriert</p>
  ) : (
    devices.map(device => (
      <div key={device.id} className="border p-4 rounded shadow-sm">
        <h3 className="font-bold capitalize">{device.type}</h3>
        <p className="text-gray-600">ID: {device.id}</p>
        {device.type === 'thermostat' && (
          <div className="mt-2">
            <p>Aktuelle Temperatur: {device.currentTemp}°C</p>
            <p>Zieltemperatur: {device.targetTemp}°C</p>
          </div>
        )}
        {device.type === 'fensterkontakt' && (
          <p className="mt-2">Status: {device.status}</p>
        )}
      </div>
    ))
  );

  // Einziges return Statement am Ende der Funktion
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">SmartHome Dashboard</h1>
     
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <h2 className="text-xl">Registrierte Geräte:</h2>
        {devicesList}
      </div>

      {/* Neue Raum-Verwaltung */}
      <RoomManager />

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <pre className="mt-2 text-sm">
          {JSON.stringify(devices, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default App;