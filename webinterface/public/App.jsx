import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get('http://localhost:3000/devices');
        console.log('Empfangene Geräte:', response.data);
        setDevices(response.data);
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
        {devices.length === 0 ? (
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
        )}
      </div>

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