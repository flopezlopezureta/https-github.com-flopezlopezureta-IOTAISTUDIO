
export enum SensorType {
  TEMPERATURE_HUMIDITY = 'DHT22 / BME280',
  LEVEL = 'Nivel (Ultrasónico/Hidrostático)',
  PRESSURE = 'Presión Industrial',
  FLOW = 'Caudalímetro',
  BATTERY = 'Monitor de Energía',
  INDUSTRIAL_4_20MA = 'Analógico 4-20mA',
  I2C = 'Sensor Digital I2C Genérico',
  GPS = 'Rastreo GNSS/GPS'
}

export type UserRole = 'admin' | 'client' | 'viewer';
export type ServiceStatus = 'active' | 'suspended' | 'expired' | 'pending';

export enum SIMProvider {
  ENTEL = 'Entel Chile',
  MOVISTAR = 'Movistar Chile',
  CLARO = 'Claro Chile',
  WOM = 'WOM Chile',
  GLOBAL_SIM = 'Global IoT SIM',
  OTHER = 'APN Personalizado'
}

export interface Company {
  id: string;
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tax_id?: string;
  billing_address?: string;
  service_start_date?: string;
  service_end_date?: string;
  service_status: ServiceStatus;
  active: boolean;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  company_id?: string;
  active: boolean;
}

export enum HardwareType {
  T_SIM7080_S3 = 'LilyGO T-SIM7080-S3',
  WALTER_ESP32_S3 = 'Walter ESP32-S3',
  ESP32_GENERIC = 'ESP32 Genérico (WiFi)',
  ESP32_C6 = 'ESP32-C6 (Zigbee/Matter)',
  RPI_PICO_W = 'Raspberry Pi Pico W'
}

export enum ProtocolType {
  HTTP_POST = 'HTTP/HTTPS REST',
  MQTT = 'MQTT v3.1.1',
  MQTTS = 'MQTT Seguro (TLS)',
  COAP = 'CoAP (UDP)'
}

export enum NetworkMode {
  CAT_M1 = 'LTE Cat-M1 (eMTC)',
  NB_IOT = 'NB-IoT',
  AUTO = 'Automático (Celular)',
  WIFI = 'WiFi (WPA2)',
  LORA = 'LoRaWAN'
}

// Configuración específica para MQTT
export interface MqttConfig {
  broker: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  topicPub: string;
  topicSub?: string;
}

// Configuración específica para HTTP
export interface HttpConfig {
  endpoint: string;
  method: 'POST' | 'PUT' | 'GET';
  authHeader?: string;
  token?: string;
}

export interface Device {
  id: string;
  name: string;
  mac_address: string;
  type: SensorType | string;
  unit: string;
  status: 'online' | 'offline' | 'maintenance';
  value: number;
  progress: number;
  company_id: string;
  location?: string;
  thresholds?: {
    min: number;
    max: number;
  };
  // Configuración de Hardware y Comunicación
  hardwareConfig?: {
    hardware: HardwareType;
    sensor: SensorType;
    networkMode: NetworkMode;
    simProvider?: SIMProvider; // Solo si es celular
    wifiSSID?: string;         // Solo si es WiFi
    wifiPass?: string;         // Solo si es WiFi
    
    protocol: ProtocolType;
    commConfig: HttpConfig | MqttConfig; // Unión de tipos según protocolo
    
    interval: number; // segundos
  };
}

export type ViewMode = 'dashboard' | 'companies' | 'users' | 'devices' | 'device-detail' | 'create-device' | 'create-company' | 'docs' | 'custom-dashboard';

// Tipos para el sistema Grafana
export type WidgetType = 'METRIC' | 'GAUGE' | 'GRAPH' | 'LOGS';

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  deviceId: string;
  size: 'small' | 'medium' | 'large';
}
