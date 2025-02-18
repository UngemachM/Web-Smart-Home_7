import React from 'react';
import RoomItem from './RoomItem';

function RoomList({ rooms, devices, onRoomUpdated }) {
  if (rooms.length === 0) {
    return <p className="text-gray-600">Noch keine Räume angelegt</p>;
  }

  return (
    <div className="grid gap-4">
      {rooms.map(room => (
        <RoomItem 
          key={room.id}
          room={room}
          devices={devices}
          onRoomUpdated={onRoomUpdated}
        />
      ))}
    </div>
  );
}

export default RoomList;