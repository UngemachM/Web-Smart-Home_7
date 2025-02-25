import React from 'react';
import RoomConfigurationDetails from './RoomConfigurationDetails';
import './RoomConfiguration.css'; // Importiere die CSS-Datei

function RoomConfigurationContainer({ room, devices, onSave, onCancel }) {
  if (!room) {
    return <p className="loading-text">Raum wird geladen...</p>;
  }

  return (
    <div className="container">
      <RoomConfigurationDetails 
        room={room}
        devices={devices}
        onSave={onSave}
        onCancel={onCancel}
      />
    </div>
  );
}

export default RoomConfigurationContainer;