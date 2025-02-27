import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RoomConfigurationDetails.css'; 

function RoomConfigurationDetails() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [thermostatsSettings, setThermostatsSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, devicesRes] = await Promise.all([
          axios.get('http://localhost:3000/rooms'),
          axios.get('http://localhost:3000/devices')
        ]);
        
        const currentRoom = roomsRes.data.find(r => r.id.toString() === roomId.toString());
        
        if (!currentRoom) {
          throw new Error('Raum nicht gefunden');
        }
        
        setRoom(currentRoom);
        setDevices(devicesRes.data);
        
        if (currentRoom.devices) {
          setSelectedDevices(currentRoom.devices);
        }
        
        const thermostatSettings = {};
        devicesRes.data.filter(device => device.type === 'thermostat').forEach(device => {
          thermostatSettings[device.id] = {
            roomTemp: currentRoom.thermostats?.[device.id]?.roomTemp || device.roomTemp || 21,
            absenkTemp: currentRoom.thermostats?.[device.id]?.absenkTemp || device.absenkTemp || 17
          };
        });
        
        setThermostatsSettings(thermostatSettings);
        setLoading(false);
      } catch (err) {
        setError('Fehler beim Laden der Daten');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [roomId]);

  const handleDeviceSelection = (deviceId, deviceType) => {
    if (deviceType === 'fensterkontakt') {
      const hasSelectedWindow = selectedDevices.some(id => {
        const device = devices.find(d => d.id === id);
        return device?.type === 'fensterkontakt';
      });

      if (hasSelectedWindow) {
        setSelectedDevices(selectedDevices.filter(id => {
          const device = devices.find(d => d.id === id);
          return device?.type !== 'fensterkontakt';
        }));
      }
      setSelectedDevices(prev => [...prev, deviceId]);
    } else {
      if (selectedDevices.includes(deviceId)) {
        setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
      } else {
        setSelectedDevices([...selectedDevices, deviceId]);
      }
    }
  };

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
      
      await axios.put(`http://localhost:3000/rooms/${roomId}/devices`, {
        deviceIds: selectedDevices
      });

      navigate('/', {
        state: {
          message: 'Raum erfolgreich konfiguriert!',
          type: 'success'
        }
      });
    } catch (error) {
      setError('Fehler beim Speichern der Konfiguration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="container">Lädt Raumkonfiguration...</div>;
  }

  if (error) {
    return <div className="container error">{error}</div>;
  }

  if (!room) {
    return <div className="container error">Raum nicht gefunden</div>;
  }

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
                onChange={() => handleDeviceSelection(device.id, device.type)}
                className="device-checkbox"
                disabled={
                  device.type === 'fensterkontakt' &&
                  selectedDevices.some(id => {
                    const selectedDevice = devices.find(d => d.id === id);
                    return selectedDevice?.type === 'fensterkontakt' && selectedDevice.id !== device.id;
                  })
                }
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
                  />
                </label>
              </div>
              <div className="input-group">
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
                  />
                </label>
              </div>
            </div>
          ))}
      </div>

      <div className="actions">
        <button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Speichern...' : 'Speichern'}
        </button>
        <button onClick={handleCancel}>Abbrechen</button>
      </div>
    </div>
  );
}

export default RoomConfigurationDetails;
