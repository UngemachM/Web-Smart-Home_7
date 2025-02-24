import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import RoomConfiguration from './components/RoomConfiguration';
import './App.css'; // Importiere die CSS-Datei

function App() {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesRes, roomsRes] = await Promise.all([
          axios.get('http://localhost:3000/devices'),
          axios.get('http://localhost:3000/rooms')
        ]);
        
        const sortedDevices = devicesRes.data.sort((a, b) => {
          const aNum = parseInt(a.id.split('_')[1]);
          const bNum = parseInt(b.id.split('_')[1]);
          
          if (a.type !== b.type) {
            return a.type === 'fensterkontakt' ? -1 : 1;
          }
          return aNum - bNum;
        });
        
        setDevices(sortedDevices);
        setRooms(roomsRes.data);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Abrufen der Daten:', err);
        setError('Fehler beim Laden der Daten');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      console.log('Nachricht empfangen:', location.state.message);
      setNotification({
        message: location.state.message,
        type: location.state.type
      });
      setTimeout(() => setNotification(null), 3000);
    }
  }, [location]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    try {
      const response = await axios.post('http://localhost:3000/rooms', {
        name: roomName
      });
      setRoomName('');
      navigate(`/configure-room/${response.data.id}`);
    } catch (err) {
      setError('Fehler beim Erstellen des Raums');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await axios.delete(`http://localhost:3000/rooms/${roomId}`);
      setRooms(rooms.filter(room => room.id !== roomId));
      setNotification({
        message: 'Raum erfolgreich gelöscht!',
        type: 'success'
      });
    } catch (err) {
      setError('Fehler beim Löschen des Raums');
    }
  };

  const handleShutdown = async () => {
    if (window.confirm('Möchten Sie das System wirklich beenden?')) {
      try {
        alert('Bitte schließen Sie den Browser-Tab manuell. Das System wird heruntergefahren.');
        await axios.post('http://localhost:3000/shutdown');
        window.close();
      } catch (error) {
        console.error('Fehler beim Herunterfahren:', error);
        setError('Fehler beim Herunterfahren des Systems');
      }
    }
  };

  const DashboardContent = () => (
    <>
      {/* Registrierte Geräte */}
      <div className="mb-6">
        <h2 className="text-xl mb-4">Registrierte Geräte:</h2>
        <div className="space-y-2">
          {devices.map(device => (
            <div key={device.id} className="device-card">
              <div className="font-bold capitalize">{device.type}</div>
              <div className="text-gray-600">ID: {device.id}</div>
              {device.type === 'fensterkontakt' && (
                <div className="text-sm text-gray-600">
                  Status: {device.status}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="notification error">
          {error}
        </div>
      )}

      {notification && (
        <div className={`notification ${notification.type === 'success' ? 'success' : 'error'}`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={handleCreateRoom} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Neuen Raum anlegen..."
            className="input"
            autoFocus
          />
          <button 
            type="submit"
            className="button primary"
          >
            Raum anlegen
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {rooms.map(room => (
          <div key={room.id} className="room-card">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{room.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/configure-room/${room.id}`)}
                  className="button edit"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  className="button delete"
                >
                  Löschen
                </button>
              </div>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium">Zugewiesene Geräte:</h4>
              <ul className="text-sm text-gray-600">
                {room.devices?.map(deviceId => {
                  const device = devices.find(d => d.id === deviceId);
                  return device ? (
                    <li key={deviceId}>
                      {device.type}: {deviceId}
                      {device.type === 'thermostat' && (
                        <span className="ml-2 text-gray-600">
                          (Aktuell: {device.currentTemp}°C, Ziel: {device.targetTemp}°C)
                        </span>
                      )}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 mb-4">
        <button 
          onClick={handleShutdown}
          className="button shutdown"
        >
          System beenden
        </button>
      </div>
    </>
  );

  return (
    <div className="container">
      <h1 className="title">SmartHome Dashboard</h1>

      <Routes>
        <Route path="/configure-room/:roomId" element={<RoomConfiguration />} />
        <Route path="/" element={<DashboardContent />} />
      </Routes>

      <div className="debug-container">
        <button 
          onClick={() => setIsDebugOpen(!isDebugOpen)}
          className="button debug-toggle"
        >
          <span className={`debug-arrow ${isDebugOpen ? 'open' : ''}`}>▶</span>
          Debug Info
        </button>
        
        {isDebugOpen && (
          <pre className="debug-info">
            {JSON.stringify({ devices, rooms }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;
