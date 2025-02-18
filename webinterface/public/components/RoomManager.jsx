import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoomForm from './RoomForm';
import RoomList from './RoomList';

function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, devicesRes] = await Promise.all([
          axios.get('http://localhost:3000/rooms'),
          axios.get('http://localhost:3000/devices')
        ]);
        setRooms(roomsRes.data);
        setDevices(devicesRes.data);
      } catch (err) {
        console.error('Fehler beim Laden der Daten:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRoomAdded = (newRoom) => {
    setRooms([...rooms, newRoom]);
  };

  const handleRoomUpdated = (updatedRoom) => {
    setRooms(rooms.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
  };

  if (loading) return <p>Lade Raum-Verwaltung...</p>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Raum-Verwaltung</h2>
      <RoomForm onRoomAdded={handleRoomAdded} />
      <RoomList 
        rooms={rooms} 
        devices={devices} 
        onRoomUpdated={handleRoomUpdated} 
      />
    </div>
  );
}

export default RoomManager;