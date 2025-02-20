import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import RoomConfiguration from './components/RoomConfiguration';

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

  const DashboardContent = () => (
    <>
      {/* Registrierte Geräte */}
      <div className="mb-6">
        <h2 className="text-xl mb-4">Registrierte Geräte:</h2>
        <div className="space-y-2">
          {devices.map(device => (
            <div key={device.id}>
              <div className="font-bold capitalize"><h3>{device.type}</h3></div>
              <div className="text-gray-600">ID: {device.id}</div>
              {/* {device.type === 'thermostat' && (
                <div className="text-sm text-gray-600">
                  <div>Aktuelle Temperatur: {device.currentTemp}°C</div>
                  <div>Zieltemperatur: {device.targetTemp}°C</div>
                </div>
              )}
              {device.type === 'fensterkontakt' && (
                <div className="text-sm text-gray-600">
                  Status: {device.status}
                </div>
              )} */}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateRoom} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Neuen Raum anlegen..."
            className="flex-grow p-2 border rounded"
            autoFocus
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Raum anlegen
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {rooms.map(room => (
          <div key={room.id} className="border p-4 rounded shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">{room.name}</h3>
              <button
                onClick={() => navigate(`/configure-room/${room.id}`)}
                className="text-blue-500 hover:text-blue-700"
              >
                Bearbeiten
              </button>
            </div>
            <div className="mt-2">
              <h4 className="text-sm font-medium">Zugewiesene Geräte:</h4>
              <ul className="text-sm text-gray-600">
                {room.devices?.map(deviceId => {
                  const device = devices.find(d => d.id === deviceId);
                  return device ? (
                    <li key={deviceId}>
                      {device.type}: {deviceId}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">SmartHome Dashboard</h1>
      
      {notification && (
        <div className={`mb-4 p-3 rounded ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}

      <Routes>
        <Route path="/configure-room/:roomId" element={<RoomConfiguration />} />
        <Route path="/" element={<DashboardContent />} />
      </Routes>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <button 
          onClick={() => setIsDebugOpen(!isDebugOpen)}
          className="font-bold flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <span className={`transform transition-transform duration-200 ${isDebugOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
          Debug Info
        </button>
        
        {isDebugOpen && (
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify({ devices, rooms }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;