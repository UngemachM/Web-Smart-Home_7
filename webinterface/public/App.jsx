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

  // fetchData außerhalb des useEffect definieren, damit sie von anderen Funktionen aufgerufen werden kann
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
      
      // Prüfe, ob die Daten tatsächlich anders sind, bevor ein Update durchgeführt wird
      const devicesChanged = JSON.stringify(sortedDevices) !== JSON.stringify(devices);
      const roomsChanged = JSON.stringify(roomsRes.data) !== JSON.stringify(rooms);
      
      // Nur aktualisieren, wenn sich etwas geändert hat
      if (devicesChanged) {
        setDevices(sortedDevices);
      }
      
      if (roomsChanged) {
        setRooms(roomsRes.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Fehler beim Abrufen der Daten:', err);
      setError('Fehler beim Laden der Daten');
    }
  };

  // Ändere deinen existierenden useEffect für das Daten-Fetching
  useEffect(() => {
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
      setTimeout(() => setNotification(null), 30000);
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

  const handleWindowStatusChange = async (deviceId, newStatus) => {
    try {
      console.log(`Sende Status-Änderung für ${deviceId} auf ${newStatus}`);
      
      // Update local state optimistically
      setDevices(prevDevices => prevDevices.map(device => 
        device.id === deviceId 
          ? { ...device, status: newStatus } 
          : device
      ));
      
      const response = await axios.post('http://localhost:3000/device/status', {
        deviceId: deviceId,
        status: newStatus
      });
      
      if (response.data.success) {
        setNotification({
          message: `Fensterstatus auf "${newStatus}" geändert!`,
          type: 'success'
        });
        
        // Warte kurz und lade dann die Daten neu
        setTimeout(() => {
          fetchData();
        }, 1000); // 1 Sekunde Verzögerung
        
      } else {
        throw new Error(response.data.error || 'Unbekannter Fehler');
      }
    } catch (err) {
      console.error('Fehler beim Ändern des Fensterstatus:', err);
      
      // Revert local state on error - get the opposite of what we tried to set
      setDevices(prevDevices => prevDevices.map(device => 
        device.id === deviceId 
          ? { ...device, status: newStatus === 'closed' ? 'open' : 'closed' } 
          : device
      ));
      
      // Detaillierte Fehlermeldung anzeigen
      const errorMessage = err.response?.data?.error || err.message || 'Fehler beim Ändern des Fensterstatus';
      setError(errorMessage);
      
      // Fehlermeldung nach 5 Sekunden ausblenden
      setTimeout(() => setError(null), 5000);
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

  const handleThermostatStatusChange = async (deviceId, currentTemp, targetTemp) => {
    try {
      setDevices(prevDevices => prevDevices.map(device => 
        device.id === deviceId 
          ? { ...device, currentTemp: currentTemp, targetTemp: targetTemp } 
          : device
      ));
      
      const response = await axios.post('http://localhost:3000/device/thermostat/status', {
        deviceId: deviceId,
        currentTemp: currentTemp,
        targetTemp: targetTemp
      });
      
      if (response.data.success) {
        setNotification({
          message: `Thermostat-Status aktualisiert!`,
          type: 'success'
        });
        
        // Auch hier nach einer erfolgreichen Thermostat-Änderung die Daten neu laden
        setTimeout(() => {
          fetchData();
        }, 250);
        
      } else {
        throw new Error(response.data.error || 'Unbekannter Fehler');
      }
    } catch (err) {
      console.error('Fehler beim Ändern des Thermostat-Status:', err);
      setError(err.response?.data?.error || err.message || 'Fehler beim Ändern des Thermostat-Status');
      setTimeout(() => setError(null), 5000);
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
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-600">
                    Status: <span className={`font-medium ${device.status === 'open' ? 'text-red-500' : 'text-green-500'}`}>{device.status}</span>
                  </div>
                  <button 
                    onClick={() => handleWindowStatusChange(device.id, device.status === 'open' ? 'closed' : 'open')}
                    className={`button small ${device.status === 'open' ? 'close-button' : 'open-button'}`}
                  >
                    {device.status === 'open' ? 'Fenster schließen' : 'Fenster öffnen'}
                  </button>
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
                    <li key={deviceId} className="flex justify-between items-center py-1">
                      <div>
                        {device.type}: {deviceId}
                        {device.type === 'thermostat' && (
  <div className="flex justify-between items-center mt-2">
    <div className="text-sm text-gray-600">
      Aktuell: {device.currentTemp}°C
    </div>
  </div>
)}
                        {device.type === 'fensterkontakt' && (
                          <span className={`ml-2 ${device.status === 'open' ? 'text-red-500' : 'text-green-500'}`}>
                            ({device.status})
                          </span>
                        )}
                      </div>
                      {device.type === 'fensterkontakt' && (
                        <button 
                          onClick={() => handleWindowStatusChange(deviceId, device.status === 'open' ? 'closed' : 'open')}
                          className={`button extra-small ${device.status === 'open' ? 'close-button' : 'open-button'}`}
                        >
                          {device.status === 'open' ? 'Schließen' : 'Öffnen'}
                        </button>
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