const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smarthome',
  user: process.env.DB_USER || 'smarthome',
  password: process.env.DB_PASSWORD || 'smarthome123',
});

client.connect();

module.exports = {
  getAllDevices: async () => {
    const res = await client.query('SELECT * FROM devices');
    return res.rows;
  },
  getDeviceById: async (id) => {
    const res = await client.query('SELECT * FROM devices WHERE id = $1', [id]);
    return res.rows[0];
  },
  getAllRooms: async () => {
    const res = await client.query('SELECT * FROM rooms');
    return res.rows;
  },
  addRoom: async (name, floor) => {
    const res = await client.query('INSERT INTO rooms (name, floor) VALUES ($1, $2) RETURNING *', [name, floor]);
    return res.rows[0];
  },
  deleteRoom: async (id) => {
    const res = await client.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
  },
  assignDevicesToRoom: async (roomId, deviceIds) => {
    const deviceIdsArray = deviceIds.map(id => `(${id}, ${roomId})`).join(',');
    await client.query(`INSERT INTO room_device (device_id, room_id) VALUES ${deviceIdsArray}`);
  },
  getDevicesByRoomId: async (roomId) => {
    const res = await client.query('SELECT * FROM devices WHERE room_id = $1', [roomId]);
    return res.rows;
  },
  registerDevice: async (device) => {
    await client.query('INSERT INTO devices (id, type, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name', [device.id, device.type, device.name]);
  },

  getAllDevicesWithRooms: async () => {
    const res = await client.query(`
      SELECT d.*, r.name AS room_name FROM devices d
      LEFT JOIN rooms r ON d.room_id = r.id
    `);
    return res.rows;
  },
  getDeviceHistory: async (id) => {
    const res = await client.query('SELECT * FROM device_history WHERE device_id = $1', [id]);
    return res.rows;
  },
  getThermostatHistory: async (id) => {
    const res = await client.query('SELECT * FROM thermostat_history WHERE device_id = $1', [id]);
    return res.rows;
  },
  getRoomById: async (id) => {
    const res = await client.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return res.rows[0]; // Gibt den Raum zurück, wenn er gefunden wurde, ansonsten null
  },
  assignDeviceToRoom: async (deviceId, roomId) => {
    // Überprüfe, ob das Gerät existiert
    const deviceRes = await client.query('SELECT * FROM devices WHERE id = $1', [deviceId]);
    if (deviceRes.rows.length === 0) {
      throw new Error(`Gerät mit ID ${deviceId} wurde nicht gefunden.`);
    }
  
    // Überprüfe, ob der Raum existiert
    const roomRes = await client.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomRes.rows.length === 0) {
      throw new Error(`Raum mit ID ${roomId} wurde nicht gefunden.`);
    }
  
    // Aktualisiere die room_id in der devices-Tabelle
    await client.query('UPDATE devices SET room_id = $1 WHERE id = $2', [roomId, deviceId]);
    console.log(`Gerät ${deviceId} wurde dem Raum ${roomId} zugewiesen.`);
  }
  
  
};
