import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import RoomConfigurationContainer from './RoomConfigurationContainer';

function RoomConfiguration() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starte Datenabruf...');
        console.log('RoomId:', roomId);
        
        const [devicesRes, roomRes] = await Promise.all([
          axios.get('http://localhost:3000/devices'),
          roomId ? axios.get(`http://localhost:3000/rooms/${roomId}`) : Promise.resolve({ data: { name: 'Neuer Raum' } })
        ]);
        
        console.log('Geräte:', devicesRes.data);
        console.log('Raum:', roomRes?.data);
        
        setDevices(devicesRes.data);
        setRoom(roomRes.data);
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
        setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  const handleSave = async (configuredRoom) => {
    try {
      console.log('Speichere Raum:', configuredRoom);
      await axios.put(`http://localhost:3000/rooms/${room.id}`, configuredRoom);
      console.log('Raum erfolgreich gespeichert');
      navigate('/', { 
        state: { 
          message: 'Raum erfolgreich gespeichert!',
          type: 'success'
        } 
      });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setError('Fehler beim Speichern. Bitte versuchen Sie es später erneut.');
    }
  };

  if (loading) {
    return <p>Lade Raumkonfiguration...</p>;
  }

  if (error) {
    return (
      <div className="mt-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="mt-8">
        <p>Raum wurde nicht gefunden.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Zurück zum Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">
        {roomId ? `${room.name} bearbeiten` : 'Neuer Raum konfigurieren'}
      </h2>
      <RoomConfigurationContainer 
        room={room}
        devices={devices}
        onSave={handleSave}
        onCancel={() => navigate('/')}
      />
    </div>
  );
}

export default RoomConfiguration;