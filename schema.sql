
-- Estructura para Selcom IoT Hub
CREATE DATABASE IF NOT EXISTS selcom_iot;
USE selcom_iot;

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tax_id VARCHAR(20),
    service_status ENUM('active', 'suspended', 'expired', 'pending') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'client', 'viewer') DEFAULT 'client',
    company_id VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_key VARCHAR(50) UNIQUE NOT NULL, -- Generalmente la MAC o IMEI
    name VARCHAR(100),
    type VARCHAR(50),
    unit VARCHAR(20),
    company_id VARCHAR(50),
    last_value FLOAT DEFAULT 0,
    status ENUM('online', 'offline', 'maintenance') DEFAULT 'offline',
    -- Columna JSON crítica para almacenar la configuración de hardware/protocolo variable
    configuration JSON, 
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS measurements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_key VARCHAR(50),
    value FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (device_key),
    INDEX (timestamp)
);

-- Usuario inicial (Super Admin)
INSERT INTO companies (id, name, service_status) VALUES ('SELCOM-CORP', 'Selcom Industrial Solutions', 'active');
INSERT INTO users (username, password, full_name, role, company_id) 
VALUES ('admin', '.Dan15223.', 'Administrador Sistema', 'admin', 'SELCOM-CORP');
