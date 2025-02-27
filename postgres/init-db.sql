-- 1️⃣ ZUERST die rooms-Tabelle erstellen
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    floor INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ DANN die devices-Tabelle, die rooms referenziert
CREATE TABLE devices (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50),
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3️⃣ Weitere Tabellen nach devices anlegen
CREATE TABLE device_status_history (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id),
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE thermostat_history (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id),
    current_temp DECIMAL(5,2) NOT NULL,
    target_temp DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4️⃣ Dann initiale Räume einfügen
INSERT INTO rooms (name, floor) VALUES 
('Living Room', 1),
('Kitchen', 1),
('Bedroom', 2),
('Bathroom', 2);

-- 5️⃣ Indizes erstellen
CREATE INDEX idx_device_history_device_id ON device_status_history(device_id);
CREATE INDEX idx_thermostat_history_device_id ON thermostat_history(device_id);
