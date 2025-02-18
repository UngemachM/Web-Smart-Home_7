import React, { useState } from 'react';
import axios from 'axios';

function RoomForm({ onRoomAdded }) {
  const [roomName, setRoomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:3000/rooms', {
        name: roomName
      });
      onRoomAdded(response.data);
      setRoomName('');
    } catch (err) {
      console.error('Fehler beim Erstellen des Raums:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Neuen Raum anlegen..."
          className="flex-grow p-2 border rounded"
        />
        <button 
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Wird angelegt...' : 'Raum anlegen'}
        </button>
      </div>
    </form>
  );
}

export default RoomForm;