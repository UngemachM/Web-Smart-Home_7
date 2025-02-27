const { Pool } = require('pg');

// Verbindung zur PostgreSQL-Datenbank
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smarthome',
  user: process.env.DB_USER || 'smarthome',
  password: process.env.DB_PASSWORD || 'smarthome123',
});

// Teste die Datenbankverbindung
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});

// Datenbank-Service-Methoden
const dbService = {
  // Alle Geräte abrufen
  getAllDevices: async () => {
    try {
      const result = await pool.query('SELECT * FROM devices ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('Error getting devices:', error);
      throw error;
    }
  },

  // Gerät anhand der ID abrufen
  getDeviceById: async (id) => {
    try {
      const result = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting device by id:', error);
      throw error;
    }
  },

  // Neues Gerät registrieren
  registerDevice: async (device) => {
    try {
      const { id, type, status } = device;
      const query = 'INSERT INTO devices (id, type, status) VALUES ($1, $2, $3) RETURNING *';
      const values = [id, type, status];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  },

  // Gerätestatus protokollieren
  logDeviceStatus: async (deviceId, status) => {
    try {
      const query = 'INSERT INTO device_status_history (device_id, status) VALUES ($1, $2) RETURNING *';
      const values = [deviceId, status];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error logging device status:', error);
      throw error;
    }
  },

  // Thermostat-Status protokollieren
  logThermostatStatus: async (deviceId, currentTemp, targetTemp) => {
    try {
      const query = 'INSERT INTO thermostat_history (device_id, current_temp, target_temp) VALUES ($1, $2, $3) RETURNING *';
      const values = [deviceId, currentTemp, targetTemp];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error logging thermostat status:', error);
      throw error;
    }
  },

  // Geräteverlauf abrufen
  getDeviceHistory: async (deviceId, limit = 100) => {
    try {
      const query = 'SELECT * FROM device_status_history WHERE device_id = $1 ORDER BY timestamp DESC LIMIT $2';
      const values = [deviceId, limit];
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting device history:', error);
      throw error;
    }
  },

  // Thermostat-Verlauf abrufen
  getThermostatHistory: async (deviceId, limit = 100) => {
    try {
      const query = 'SELECT * FROM thermostat_history WHERE device_id = $1 ORDER BY timestamp DESC LIMIT $2';
      const values = [deviceId, limit];
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting thermostat history:', error);
      throw error;
    }
  },

  // Alle Räume abrufen
  getAllRooms: async () => {
    try {
      const result = await pool.query('SELECT * FROM rooms ORDER BY name');
      return result.rows;
    } catch (error) {
      console.error('Error getting rooms:', error);
      throw error;
    }
  },

  // Neuen Raum hinzufügen
  addRoom: async (name, floor) => {
    try {
      const query = 'INSERT INTO rooms (name, floor) VALUES ($1, $2) RETURNING *';
      const values = [name, floor];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error adding room:', error);
      throw error;
    }
  },

  // Raum löschen
  deleteRoom: async (roomId) => {
    try {
      const query = 'DELETE FROM rooms WHERE id = $1 RETURNING *';
      const values = [roomId];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  },
  // Add these methods to dbService

// Lade alle Geräte mit ihren Räumen
getAllDevicesWithRooms: async () => {
  try {
    const query = `
      SELECT d.*, r.name as room_name, r.floor as room_floor
      FROM devices d
      LEFT JOIN rooms r ON d.room_id = r.id
      ORDER BY d.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting devices with rooms:', error);
    throw error;
  }
},

// Geräte zu einem Raum hinzufügen
assignDevicesToRoom: async (roomId, deviceIds) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Erst alle Geräte vom Raum entfernen
      await client.query('UPDATE devices SET room_id = NULL WHERE room_id = $1', [roomId]);
      
      // Dann die neuen Geräte zuweisen
      if (deviceIds && deviceIds.length > 0) {
        const values = deviceIds.map(deviceId => {
          return `('${deviceId}', ${roomId})`;
        }).join(',');
        
        await client.query(`
          UPDATE devices 
          SET room_id = v.room_id
          FROM (VALUES ${values}) AS v(id, room_id)
          WHERE devices.id = v.id
        `);
      }
      
      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error assigning devices to room:', error);
    throw error;
  }
},

// Geräte mit ihrem aktuellen Status aktualisieren
updateDeviceStatus: async (deviceId, status) => {
  try {
    const query = 'UPDATE devices SET status = $1 WHERE id = $2 RETURNING *';
    const values = [status, deviceId];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating device status:', error);
    throw error;
  }
},

// Thermostat-Status aktualisieren
updateThermostatStatus: async (deviceId, currentTemp, targetTemp) => {
  try {
    const query = `
      UPDATE devices 
      SET 
        current_temp = $1, 
        target_temp = $2 
      WHERE id = $3 
      RETURNING *
    `;
    const values = [currentTemp, targetTemp, deviceId];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating thermostat status:', error);
    throw error;
  }
},

// Alle Geräte in einem Raum abrufen
getDevicesByRoomId: async (roomId) => {
  try {
    const query = 'SELECT * FROM devices WHERE room_id = $1';
    const values = [roomId];
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting devices by room id:', error);
    throw error;
  }
}
};

// In the registerDevice method
registerDevice: async (device) => {
  try {
    const { id, type, status, currentTemp, targetTemp } = device;
    let query, values;
    
    if (type === 'thermostat') {
      query = 'INSERT INTO devices (id, type, current_temp, target_temp) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET type = $2, current_temp = $3, target_temp = $4 RETURNING *';
      values = [id, type, currentTemp, targetTemp];
    } else {
      query = 'INSERT INTO devices (id, type, status) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET type = $2, status = $3 RETURNING *';
      values = [id, type, status];
    }
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error registering device:', error);
    throw error;
  }
}

// Get a single room by ID
getRoomById: async (id) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting room by id:', error);
    throw error;
  }
}



module.exports = dbService;