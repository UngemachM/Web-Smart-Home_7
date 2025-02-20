import React from 'react';
import RoomConfigurationDetails from './RoomConfigurationDetails';

function RoomConfigurationContainer({ room, devices, onSave, onCancel }) {
  if (!room) {
    return <p className="text-gray-600">Raum wird geladen...</p>;
  }

  return (
    <div>
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