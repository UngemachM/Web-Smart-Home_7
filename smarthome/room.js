// rooms.js
const rooms = new Map();

function setupRoomRoutes(fastify) {
  // Get all rooms
  fastify.get('/rooms', async (request, reply) => {
    return Array.from(rooms.values());
  });

  // Create a new room
  fastify.post('/rooms', async (request, reply) => {
    const { name } = request.body;
    const roomId = `room_${Date.now()}`;
    const newRoom = {
      id: roomId,
      name,
      devices: []
    };
    rooms.set(roomId, newRoom);
    return newRoom;
  });

  // Add devices to a room
  fastify.put('/rooms/:roomId/devices', async (request, reply) => {
    const { roomId } = request.params;
    const { deviceIds } = request.body;
    
    const room = rooms.get(roomId);
    if (!room) {
      reply.code(404).send({ error: 'Room not found' });
      return;
    }
    
    room.devices = deviceIds;
    return room;
  });

  fastify.put('/rooms/:roomId/temperature', async (request, reply) => {
    const { roomId } = request.params;
    const { thermostats } = request.body;
    
    const room = rooms.get(roomId);
    if (!room) {
      reply.code(404).send({ error: 'Room not found' });
      return;
    }
    
    // Speichere Einstellungen für jedes Thermostat
    Object.entries(thermostats).forEach(([thermostatId, settings]) => {
      // MQTT Nachricht an spezifisches Thermostat senden
      fastify.mqtt.publish(`smarthome/thermostat/${thermostatId}/setTemp`, 
        JSON.stringify(settings)
      );
    });
    
    // Speichere die Einstellungen auch im Room-Objekt
    room.thermostatSettings = thermostats;
    
    return room;
  });
  
  fastify.get('/rooms/:roomId/temperature', async (request, reply) => {
    const { roomId } = request.params;
    const room = rooms.get(roomId);
    
    if (!room) {
      reply.code(404).send({ error: 'Room not found' });
      return;
    }
    
    return {
      roomTemperature: room.roomTemperature || null,
      devices: room.devices
    };
  });


}

module.exports = { setupRoomRoutes };